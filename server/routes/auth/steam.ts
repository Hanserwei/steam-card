import { formatErrorForLog } from '~~/server/core/utils/error'
import { steamAuth } from '~~/server/core/utils/steamAuth'

export default defineEventHandler(async (event) => {
  try {
    const runtimeConfig = useRuntimeConfig(event)
    const origin = String(runtimeConfig.public.origin || getRequestURL(event).origin).replace(/\/+$/, '')
    const protocol = new URL(origin).protocol
    if (protocol !== 'http:' && protocol !== 'https:')
      throw new Error('Unsupported public origin protocol.')

    const { getRedirectUrl } = steamAuth(origin)
    const redirectUrl = await getRedirectUrl()

    return {
      redirectUrl,
    }
  }
  catch (error) {
    console.error(`[Steam Card] authentication initialization failed: ${formatErrorForLog(error)}`)
    throw createError({
      statusCode: 500,
      statusMessage: 'Steam authentication failed.',
    })
  }
})
