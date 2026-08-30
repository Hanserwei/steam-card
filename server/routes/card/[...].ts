import type { Count } from '#shared/types'
import initLocale from '~~/server/core/locales'
import { crawler, data, parseUrlConfig } from '~~/server/core/logic'
import { generateError } from '~~/server/core/render/template/error'
import { generateSvg } from '~~/server/core/render/template/svg'
import { getGameCoverUrl, getPlayerSummaries, getRecentlyPlayedGames, getSteamProfile } from '~~/server/core/request/steamApi'
import { imageUrl2Base64, transparentImageBase64 } from '~~/server/core/utils'

const i18n = initLocale('zhCN')
const JPEG_PREFIX = 'data:image/jpeg;base64,'
const PNG_PREFIX = 'data:image/png;base64,'

export default defineEventHandler(async (event) => {
  try {
    const runtimeConfig = useRuntimeConfig(event)
    const steamKey = runtimeConfig.steamKey
    const cacheTime = runtimeConfig.cacheTime || '3600'
    const blockUsers = runtimeConfig.blockUsers || ''
    const blockApps = runtimeConfig.blockApps || ''

    setHeader(event, 'Content-Type', 'image/svg+xml')
    setHeader(event, 'Cache-Control', `public, max-age=${cacheTime}`)
    const { _ } = event.context.params as { _: string }
    const splitArr = _.split('/')
    const steamid = splitArr[0]
    const settings = splitArr[1] ?? ''
    const numberReg = /[A-Z]/i
    if (!steamid || steamid.match(numberReg) !== null)
      return generateError(i18n.get('invalid_steamid'), i18n.get('error-info'))

    if (blockUsers.split(',').includes(steamid))
      return generateError('Sorry, your account had been banned.', i18n.get('error-info'))

    const { config } = parseUrlConfig(settings)
    i18n.setLocale(config.lang)

    const AllData = await Promise.all([
      getPlayerSummaries({ key: steamKey, steamids: steamid }),
      getRecentlyPlayedGames({
        format: 'json',
        steamid,
        key: steamKey,
        count: 0,
      }),
      getSteamProfile(steamid),
    ])
    const [player, playedGames, profile] = AllData
    const userInfo = player.response.players[0]
    if (!userInfo)
      return generateError(i18n.get('invalid_steamid'), i18n.get('error-info'))

    const {
      gameCount,
      groupCount,
      badgeIconUrl,
      groupIconList,
      screenshotCount,
      artWorkCount,
      reviewCount,
      guideCount,
      badgeCount,
      playerLevel,
      avatarUrl,
    } = crawler(profile)

    const { games, playTime, name, isOnline } = data(userInfo, playedGames.response, blockApps)
    let badgeIcon = ''
    if (badgeIconUrl) {
      badgeIcon = await imageUrl2Base64(badgeIconUrl)
      badgeIcon = badgeIcon ? PNG_PREFIX + badgeIcon : transparentImageBase64
    }

    let avatarUrlBase64 = await imageUrl2Base64(avatarUrl!)
    avatarUrlBase64 = avatarUrlBase64 ? JPEG_PREFIX + avatarUrlBase64 : transparentImageBase64

    for (const [index, groupIconUrl] of groupIconList.entries()) {
      const groupIcon = await imageUrl2Base64(groupIconUrl)
      groupIconList[index] = groupIcon ? JPEG_PREFIX + groupIcon : transparentImageBase64
    }

    const gameImgs: string[] = []

    for (const game of games) {
      const url = await getGameCoverUrl(game.appid)
      if (url) {
        const gameImage = await imageUrl2Base64(url)
        gameImgs.push(gameImage ? JPEG_PREFIX + gameImage : transparentImageBase64)
      }
      else {
        gameImgs.push(transparentImageBase64)
      }
    }

    const counts: Count[] = []

    config.statistics.forEach((item: any) => {
      switch (item) {
        case 'games':
          counts.push({
            name: i18n.get('games'),
            count: gameCount,
          })
          break
        case 'screenshots':
          counts.push({
            name: i18n.get('screenshots'),
            count: screenshotCount,
          })
          break
        case 'artworks':
          counts.push({
            name: i18n.get('artworks'),
            count: artWorkCount,
          })
          break
        case 'reviews':
          counts.push({
            name: i18n.get('reviews'),
            count: reviewCount,
          })
          break
        case 'guides':
          counts.push({
            name: i18n.get('guides'),
            count: guideCount,
          })
          break
        case 'groups':
          counts.push({
            name: i18n.get('groups'),
            count: groupCount,
          })
          break
        case 'badges':
          counts.push({
            name: i18n.get('badges'),
            count: badgeCount,
          })
          break
      }
    })

    if (config.bg.includes('bg-game')) {
      const arrs = config.bg.split('-')
      let url: string | null = null
      if (arrs.length < 3) {
        const { appid } = await $fetch<{
          appid: number
        }>(`/info/games/${steamid}`)
        url = await getGameCoverUrl(appid!)
      }
      else if (arrs[2]) {
        url = await getGameCoverUrl(arrs[2])
      }
      let gameBase64 = transparentImageBase64
      if (url) {
        gameBase64 = await imageUrl2Base64(url)
        gameBase64 = gameBase64 ? JPEG_PREFIX + gameBase64 : transparentImageBase64
      }
      config.bg = `game-${gameBase64}`
    }

    return generateSvg({
      name,
      avatarUrlBase64,
      playerLevel,
      isOnline,
      gameImgs,
      theme: config.theme,
      badge: config.badge,
      group: config.group,
      bg: config.bg,
      textColor: config.textColor,
      playTime,
      groupIconList,
      badgeIcon,
      i18n,
      counts,
    })
  }
  catch (error) {
    console.error('[Steam Card] generate error:', error)
    return generateError(String(error), 'error')
  }
})
