import { getOwnedGames } from '~~/server/core/request/steamApi'
import { formatErrorForLog } from '~~/server/core/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const runtimeConfig = useRuntimeConfig(event)
    const steamKey = runtimeConfig.steamKey
    const blockApps = runtimeConfig.blockApps || ''
    const apps = blockApps.split(',')

    const id = getRouterParam(event, 'id')
    const { response } = await getOwnedGames({
      key: steamKey,
      steamid: id,
      format: 'json',
    })

    // find the longest play time game
    const game = response.games.sort((a, b) => b.playtime_forever - a.playtime_forever).find(i => !apps.includes(i.appid?.toString()))
    return {
      appid: game?.appid,
    }
  }
  catch (error) {
    console.error(`[Steam Card] owned games lookup failed: ${formatErrorForLog(error)}`)
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to contact Steam.',
    })
  }
})
