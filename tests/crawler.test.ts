import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { describe, expect, it } from 'vitest'
import { crawler } from '~~/server/core/logic/crawler'

describe('crawler', () => {
  it('crawler', async () => {
    const html = await readFile(join(cwd(), 'tests', 'fixtures', 'profile.html'), 'utf-8')

    expect(crawler(html)).toMatchSnapshot()
  })

  it('uses the featured badge when one is configured', () => {
    const result = crawler(`
      <a class="favorite_badge">
        <div class="favorite_badge_icon">
          <img src="https://cdn.example.test/featured.png">
        </div>
      </a>
      <div class="profile_badges">
        <div class="profile_badges_badge">
          <img class="badge_icon small" src="https://cdn.example.test/recent.png">
        </div>
      </div>
    `)

    expect(result.badgeIconUrl).toBe('https://cdn.example.test/featured.png')
  })

  it('falls back to the first profile badge when no featured badge is configured', () => {
    const result = crawler(`
      <div class="profile_badges">
        <div class="profile_badges_badge">
          <img class="badge_icon small" src="https://cdn.example.test/first.png">
        </div>
        <div class="profile_badges_badge last">
          <img class="badge_icon small" src="https://cdn.example.test/second.png">
        </div>
      </div>
    `)

    expect(result.badgeIconUrl).toBe('https://cdn.example.test/first.png')
  })

  it('returns undefined when the profile has no badges', () => {
    expect(crawler('<main class="profile_page"></main>').badgeIconUrl).toBeUndefined()
  })
})
