const QUERY_SECRET_PATTERN = /([?&](?:api[_-]?key|key|token)=)[^&\s"'<>]+/gi
const STEAM_KEY_PATTERN = /\b[A-F\d]{32}\b/gi

export function formatErrorForLog(error: unknown): string {
  const message = error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error)

  return message
    .replace(QUERY_SECRET_PATTERN, '$1[REDACTED]')
    .replace(STEAM_KEY_PATTERN, '[REDACTED]')
    .slice(0, 500)
}
