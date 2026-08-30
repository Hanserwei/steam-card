import type { Count, TemplateMeta } from '#shared/types'

export function generateCounts(meta: TemplateMeta) {
  let countsSvg = ''

  meta.counts.forEach((item: Count) => {
    countsSvg += /* html */`
      <div class="count-item">
        <div class="count">${item.count || 0}</div>
        <div class="name">${item.name}</div>
      </div>
    `
  })

  return countsSvg
}
