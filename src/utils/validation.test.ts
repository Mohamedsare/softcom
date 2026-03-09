import { describe, it, expect } from 'vitest'

/**
 * Example unit test — validations and guards can be tested here.
 * Add vitest if not present.
 */
describe('validation', () => {
  it('slug format', () => {
    const slugRegex = /^[a-z0-9-]+$/
    expect(slugRegex.test('demo-1')).toBe(true)
    expect(slugRegex.test('Demo')).toBe(false)
    expect(slugRegex.test('')).toBe(false)
  })
})
