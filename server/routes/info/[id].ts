import { getPlayerSummaries } from '~~/server/core/request/steamApi'

export default defineEventHandler(async (event) => {
  try {
    const runtimeConfig = useRuntimeConfig(event)
    const steamKey = runtimeConfig.steamKey
    const id = getRouterParam(event, 'id')!
    const { response } = await getPlayerSummaries({
      key: steamKey,
      steamids: id,
    })
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
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: String(error),
    })
  }
})
