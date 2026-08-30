import { describe, expect, it } from 'vitest'
import { generateSvg } from '~~/server/core/render/template/svg'
import templateMeta from './fixtures/templateMeta'

describe('template', () => {
  it('template', async () => {
    expect(generateSvg(templateMeta)).toMatchSnapshot()
  })
})
