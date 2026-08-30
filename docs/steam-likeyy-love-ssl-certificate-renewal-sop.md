# steam.likeyy.love SSL 证书更新 SOP

## 1. 目的与适用范围

本文档用于更新 `steam.likeyy.love` 的 HTTPS 证书，并在不重启 FRPS、FRPC、Steam Card 或其他站点的情况下安全 reload 1Panel OpenResty。

当前流量路径：

```text
用户 HTTPS 请求
  → 125.208.22.200:443（1Panel OpenResty）
  → 127.0.0.1:7300（FRPS 回环代理）
  → FRP TLS 隧道
  → 192.168.1.239:3000（家庭 Ubuntu 上的 Steam Card）
```

当前相关路径：

```text
OpenResty 容器：1Panel-openresty-hsph
站点配置：/opt/1panel/www/conf.d/steam.likeyy.love.conf
证书链：/opt/1panel/www/sites/steam.likeyy.love/ssl/fullchain.pem
私钥：/opt/1panel/www/sites/steam.likeyy.love/ssl/privkey.pem
访问日志：/opt/1panel/www/sites/steam.likeyy.love/log/access.log
错误日志：/opt/1panel/www/sites/steam.likeyy.love/log/error.log
```

> 当前证书有效期为 2026-08-30 至 2026-11-28。应至少提前 30 天申请和更换新证书。

## 2. 安全要求

- 私钥不得发送到聊天、工单、Git 仓库或普通日志。
- 不得使用 `cat`、`head` 等命令输出私钥正文。
- 本地临时私钥权限必须为 `0600`，操作完成后使用 `shred -u` 清理。
- 服务器私钥必须为 `root:root 0600`。
- 必须先验证域名、有效期、证书链和公私钥匹配，再执行替换。
- 必须先备份，再原子替换；必须通过 `openresty -t` 后才能 reload。
- 使用 SSH Key 登录服务器；不要把密码直接写入脚本或命令历史。

## 3. 前置检查

确认 DNS 仍指向公网服务器：

```bash
dig +short A steam.likeyy.love
```

期望值：

```text
125.208.22.200
```

确认当前站点可访问：

```bash
curl --fail --silent --show-error --head https://steam.likeyy.love/
```

确认服务器、Docker 和 OpenResty 正常：

```bash
ssh root@125.208.22.200
docker ps --filter name=1Panel-openresty
docker exec 1Panel-openresty-hsph openresty -t
```

## 4. 解压新证书到安全临时目录

以下示例假设证书压缩包位于：

```text
/home/hanserwei/Downloads/steam.likeyy.love_nginx.zip
```

执行：

```bash
CERT_ZIP=/home/hanserwei/Downloads/steam.likeyy.love_nginx.zip
CERT_WORK_DIR=$(mktemp -d)

unzip -p "$CERT_ZIP" \
  'steam.likeyy.love_nginx/steam.likeyy.love_bundle.crt' \
  > "$CERT_WORK_DIR/fullchain.pem"

unzip -p "$CERT_ZIP" \
  'steam.likeyy.love_nginx/steam.likeyy.love.key' \
  > "$CERT_WORK_DIR/privkey.pem"

chmod 0644 "$CERT_WORK_DIR/fullchain.pem"
chmod 0600 "$CERT_WORK_DIR/privkey.pem"
```

如果证书包内文件名有变化，先只列出文件名，不要直接解压到项目目录：

```bash
unzip -Z1 "$CERT_ZIP"
```

## 5. 本地验证新证书

### 5.1 查看域名、签发方和有效期

```bash
openssl x509 \
  -in "$CERT_WORK_DIR/fullchain.pem" \
  -noout -subject -issuer -serial -dates
```

检查 SAN：

```bash
openssl x509 \
  -in "$CERT_WORK_DIR/fullchain.pem" \
  -noout -text \
  | awk '/Subject Alternative Name/{getline; gsub(/^ +/, ""); print}'
```

输出必须包含：

```text
DNS:steam.likeyy.love
```

确认至少还有 30 天有效期：

```bash
openssl x509 \
  -in "$CERT_WORK_DIR/fullchain.pem" \
  -checkend 2592000 -noout
```

### 5.2 验证证书链内容

```bash
openssl crl2pkcs7 \
  -nocrl \
  -certfile "$CERT_WORK_DIR/fullchain.pem" \
  | openssl pkcs7 -print_certs -noout
```

应至少包含站点证书和中间证书。不要只上传单张叶子证书。

### 5.3 验证私钥合法且与证书匹配

验证私钥，不输出私钥：

```bash
openssl pkey \
  -in "$CERT_WORK_DIR/privkey.pem" \
  -check -noout
```

比较公钥摘要：

```bash
CERT_PUB_SHA=$(openssl x509 \
  -in "$CERT_WORK_DIR/fullchain.pem" \
  -pubkey -noout \
  | openssl pkey -pubin -outform DER 2>/dev/null \
  | sha256sum \
  | cut -d' ' -f1)

KEY_PUB_SHA=$(openssl pkey \
  -in "$CERT_WORK_DIR/privkey.pem" \
  -pubout -outform DER 2>/dev/null \
  | sha256sum \
  | cut -d' ' -f1)

test "$CERT_PUB_SHA" = "$KEY_PUB_SHA"
echo '证书与私钥匹配'
```

任何一步失败都必须停止，不得继续上传。

## 6. 上传为临时文件

```bash
scp "$CERT_WORK_DIR/fullchain.pem" \
  root@125.208.22.200:/tmp/steam.likeyy.love.fullchain.pem.new

scp "$CERT_WORK_DIR/privkey.pem" \
  root@125.208.22.200:/tmp/steam.likeyy.love.privkey.pem.new
```

上传后不要立刻覆盖正式证书。

## 7. 服务器端复验、备份和原子替换

登录服务器：

```bash
ssh root@125.208.22.200
```

设置本次操作变量：

```bash
SITE_NAME=steam.likeyy.love
SITE_SSL_DIR=/opt/1panel/www/sites/steam.likeyy.love/ssl
BACKUP_STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=/root/ssl-backups/steam.likeyy.love-$BACKUP_STAMP

install -d -m 0700 "$BACKUP_DIR"
```

再次验证上传内容：

```bash
openssl x509 \
  -in /tmp/steam.likeyy.love.fullchain.pem.new \
  -checkend 2592000 -noout

openssl x509 \
  -in /tmp/steam.likeyy.love.fullchain.pem.new \
  -noout -text \
  | grep -A1 'Subject Alternative Name' \
  | grep -q 'DNS:steam.likeyy.love'
```

验证公私钥匹配：

```bash
CERT_PUB_SHA=$(openssl x509 \
  -in /tmp/steam.likeyy.love.fullchain.pem.new \
  -pubkey -noout \
  | openssl pkey -pubin -outform DER 2>/dev/null \
  | sha256sum \
  | cut -d' ' -f1)

KEY_PUB_SHA=$(openssl pkey \
  -in /tmp/steam.likeyy.love.privkey.pem.new \
  -pubout -outform DER 2>/dev/null \
  | sha256sum \
  | cut -d' ' -f1)

test "$CERT_PUB_SHA" = "$KEY_PUB_SHA"
```

备份当前证书和站点配置：

```bash
cp -a "$SITE_SSL_DIR/fullchain.pem" "$BACKUP_DIR/fullchain.pem"
cp -a "$SITE_SSL_DIR/privkey.pem" "$BACKUP_DIR/privkey.pem"
cp -a /opt/1panel/www/conf.d/steam.likeyy.love.conf \
  "$BACKUP_DIR/steam.likeyy.love.conf"
```

先安装到同目录临时文件，再原子替换：

```bash
install -o root -g root -m 0644 \
  /tmp/steam.likeyy.love.fullchain.pem.new \
  "$SITE_SSL_DIR/fullchain.pem.next"

install -o root -g root -m 0600 \
  /tmp/steam.likeyy.love.privkey.pem.new \
  "$SITE_SSL_DIR/privkey.pem.next"

mv "$SITE_SSL_DIR/fullchain.pem.next" "$SITE_SSL_DIR/fullchain.pem"
mv "$SITE_SSL_DIR/privkey.pem.next" "$SITE_SSL_DIR/privkey.pem"
```

确认权限：

```bash
stat -c '%n mode=%a owner=%U:%G' \
  "$SITE_SSL_DIR/fullchain.pem" \
  "$SITE_SSL_DIR/privkey.pem"
```

期望：

```text
fullchain.pem mode=644 owner=root:root
privkey.pem mode=600 owner=root:root
```

## 8. 配置测试与无中断 reload

必须先测试：

```bash
docker exec 1Panel-openresty-hsph openresty -t
```

只有输出包含以下内容时才可 reload：

```text
syntax is ok
test is successful
```

无中断加载新证书：

```bash
docker exec 1Panel-openresty-hsph openresty -s reload
sleep 2
docker exec 1Panel-openresty-hsph openresty -t
```

清理服务器临时文件：

```bash
shred -u /tmp/steam.likeyy.love.privkey.pem.new
rm -f /tmp/steam.likeyy.love.fullchain.pem.new
```

## 9. 公网验证

确认 HTTP 跳转到 HTTPS：

```bash
curl --head http://steam.likeyy.love/
```

期望：

```text
HTTP/1.1 301 Moved Permanently
Location: https://steam.likeyy.love/
```

验证实际对外证书：

```bash
openssl s_client \
  -connect steam.likeyy.love:443 \
  -servername steam.likeyy.love \
  -verify_return_error \
  </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -serial -dates
```

验证页面和接口：

```bash
curl --fail --silent --show-error --http2 \
  --output /dev/null \
  --write-out 'root=%{http_code} http=%{http_version}\n' \
  https://steam.likeyy.love/

curl --fail --silent --show-error \
  https://steam.likeyy.love/info/76561199005762557

curl --fail --silent --show-error \
  --output /tmp/steam-card-check.svg \
  https://steam.likeyy.love/card/76561199005762557

grep -q '<svg' /tmp/steam-card-check.svg
rm -f /tmp/steam-card-check.svg
```

检查错误日志：

```bash
tail -n 100 /opt/1panel/www/sites/steam.likeyy.love/log/error.log
```

## 10. 回滚流程

如果 `openresty -t` 失败、HTTPS 无法访问或证书异常，立即回滚：

```bash
SITE_SSL_DIR=/opt/1panel/www/sites/steam.likeyy.love/ssl
BACKUP_DIR=/root/ssl-backups/steam.likeyy.love-替换为本次备份时间

install -o root -g root -m 0644 \
  "$BACKUP_DIR/fullchain.pem" \
  "$SITE_SSL_DIR/fullchain.pem"

install -o root -g root -m 0600 \
  "$BACKUP_DIR/privkey.pem" \
  "$SITE_SSL_DIR/privkey.pem"

cp -a "$BACKUP_DIR/steam.likeyy.love.conf" \
  /opt/1panel/www/conf.d/steam.likeyy.love.conf

docker exec 1Panel-openresty-hsph openresty -t
docker exec 1Panel-openresty-hsph openresty -s reload
```

回滚后重新执行第 9 节的公网验证。

## 11. 本地敏感文件清理

完成全部验证后，在最初执行解压操作的终端中运行：

```bash
shred -u "$CERT_WORK_DIR/privkey.pem"
rm -f "$CERT_WORK_DIR/fullchain.pem"
rmdir "$CERT_WORK_DIR"
unset CERT_WORK_DIR CERT_ZIP CERT_PUB_SHA KEY_PUB_SHA
```

不要删除原始证书压缩包，除非已经有其他加密备份。原始压缩包本身包含私钥，应移动到权限受控或加密存储中，不应长期留在普通 Downloads 目录。

## 12. 完成检查表

- [ ] DNS A 记录仍为 `125.208.22.200`
- [ ] 新证书 SAN 包含 `steam.likeyy.love`
- [ ] 新证书至少还有 30 天有效期
- [ ] 证书链不只包含单张叶子证书
- [ ] 私钥合法且与证书匹配
- [ ] 当前证书和配置已备份
- [ ] `fullchain.pem` 权限为 `0644`
- [ ] `privkey.pem` 权限为 `0600`
- [ ] `openresty -t` 成功
- [ ] OpenResty 已无中断 reload
- [ ] HTTP 301 跳转正确
- [ ] 公网实际证书已更新
- [ ] 首页、`/info`、`/card` 均正常
- [ ] 错误日志无新增 TLS 或代理错误
- [ ] 服务器和本地临时私钥已安全清理
