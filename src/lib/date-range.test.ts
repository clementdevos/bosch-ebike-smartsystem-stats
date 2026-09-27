import { describe, it, expect } from 'vitest'
import { presetRange, isWithinRange, ALL_TIME } from './date-range'

// Local time, deliberately — presets like "month to date" mean the user's
// calendar month, not the UTC one.
const NOW = new Date(2026, 2, 15, 12, 0, 0)

describe('presetRange', () => {
  it('today spans midnight to now', () => {
    const r = presetRange('today', NOW)
    expect(r.from).toBe(new Date(2026, 2, 15, 0, 0, 0).getTime())
    expect(r.to).toBe(NOW.getTime())
  })

  it('yesterday spans a full previous day', () => {
    const r = presetRange('yesterday', NOW)
    expect(r.from).toBe(new Date(2026, 2, 14, 0, 0, 0).getTime())
    expect(r.to).toBe(new Date(2026, 2, 15, 0, 0, 0).getTime() - 1)
  })

  it('7d covers the trailing week', () => {
    const r = presetRange('7d', NOW)
    expect(r.to).toBe(NOW.getTime())
    expect(r.from).toBe(NOW.getTime() - 7 * 86_400_000)
  })

  it('mtd starts on the 1st of the current month', () => {
    const r = presetRange('mtd', NOW)
    expect(r.from).toBe(new Date(2026, 2, 1, 0, 0, 0).getTime())
  })

  it('ytd starts on Jan 1st of the current year', () => {
    const r = presetRange('ytd', NOW)
    expect(r.from).toBe(new Date(2026, 0, 1, 0, 0, 0).getTime())
  })
})

describe('isWithinRange', () => {
  it('matches everything for the all-time range', () => {
    expect(isWithinRange('2020-01-01T00:00:00Z', ALL_TIME)).toBe(true)
  })

  it('excludes dates before the lower bound', () => {
    const range = { from: NOW.getTime(), to: null }
    expect(isWithinRange('2026-03-14T00:00:00Z', range)).toBe(false)
    expect(isWithinRange('2026-03-16T00:00:00Z', range)).toBe(true)
  })

  it('excludes dates after the upper bound', () => {
    const range = { from: null, to: NOW.getTime() }
    expect(isWithinRange('2026-03-16T00:00:00Z', range)).toBe(false)
    expect(isWithinRange('2026-03-14T00:00:00Z', range)).toBe(true)
  })
})
