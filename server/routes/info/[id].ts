import { getPlayerSummaries } from '~~/server/core/request/steamApi'
import { formatErrorForLog } from '~~/server/core/utils/error'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const steamKey = runtimeConfig.steamKey
  const id = getRouterParam(event, 'id')!
  let response

  try {
    const result = await getPlayerSummaries({
      key: steamKey,
      steamids: id,
    })
    response = result.response
  }
  catch (error) {
    console.error(`[Steam Card] player lookup failed: ${formatErrorForLog(error)}`)
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to contact Steam.',
    })
  }

  const player = response.players[0]
  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Steam user not found.',
    })
  }

  return {
    avatar: player.avatarfull,
    nickName: player.personaname,
  }
})
