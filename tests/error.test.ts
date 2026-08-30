import { describe, expect, it } from 'vitest'
import { formatErrorForLog } from '~~/server/core/utils/error'

describe('format error for logs', () => {
  it('redacts API keys from request URLs', () => {
    const secret = 'A'.repeat(32)
    const error = new Error(`GET https://api.example.test/player?key=${secret}&id=42 failed`)
    const formatted = formatErrorForLog(error)

    expect(formatted).not.toContain(secret)
    expect(formatted).toContain('key=[REDACTED]')
    expect(formatted).toContain('id=42')
  })

  it('redacts standalone Steam API keys', () => {
    const secret = 'B'.repeat(32)

    expect(formatErrorForLog(secret)).toBe('[REDACTED]')
  })
})
