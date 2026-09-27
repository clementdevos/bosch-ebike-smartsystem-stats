import { describe, it, expect } from 'vitest'
import {
  presetRange,
  isWithinRange,
  normalizeRange,
  localDateInputValue,
  parseLocalDateInput,
  endOfDay,
  ALL_TIME,
} from './date-range'

// Local time, deliberately — presets like "month to date" mean the user's
// calendar month, not the UTC one.
const NOW = new Date(2026, 2, 15, 12, 0, 0)

describe('presetRange', () => {
  it('today spans midnight to end of today', () => {
    const r = presetRange('today', NOW)
    expect(r.from).toBe(new Date(2026, 2, 15, 0, 0, 0).getTime())
    expect(r.to).toBe(new Date(2026, 2, 16, 0, 0, 0).getTime() - 1)
  })

  it('yesterday spans a full previous day', () => {
    const r = presetRange('yesterday', NOW)
    expect(r.from).toBe(new Date(2026, 2, 14, 0, 0, 0).getTime())
    expect(r.to).toBe(new Date(2026, 2, 15, 0, 0, 0).getTime() - 1)
  })

  it('7d covers today plus the 6 preceding calendar days', () => {
    const r = presetRange('7d', NOW)
    expect(r.to).toBe(new Date(2026, 2, 16, 0, 0, 0).getTime() - 1)
    expect(r.from).toBe(new Date(2026, 2, 9, 0, 0, 0).getTime())
  })

  it('mtd starts on the 1st of the current month', () => {
    const r = presetRange('mtd', NOW)
    expect(r.from).toBe(new Date(2026, 2, 1, 0, 0, 0).getTime())
  })

  it('ytd starts on Jan 1st of the current year', () => {
    const r = presetRange('ytd', NOW)
    expect(r.from).toBe(new Date(2026, 0, 1, 0, 0, 0).getTime())
  })

  it('does not exclude an activity synced later the same day', () => {
    const r = presetRange('today', NOW)
    const laterToday = new Date(2026, 2, 15, 23, 30, 0).toISOString()
    expect(isWithinRange(laterToday, r)).toBe(true)
  })
})

describe('endOfDay', () => {
  it('lands exactly 1ms before local midnight of the next calendar day', () => {
    const d = new Date(2026, 2, 15, 10, 0, 0)
    const nextMidnight = new Date(2026, 2, 16, 0, 0, 0)
    expect(endOfDay(d).getTime()).toBe(nextMidnight.getTime() - 1)
  })
})

describe('normalizeRange', () => {
  it('swaps from/to when out of order', () => {
    const r = normalizeRange({ from: 200, to: 100 })
    expect(r).toEqual({ from: 100, to: 200 })
  })

  it('leaves an already-ordered range untouched', () => {
    const r = normalizeRange({ from: 100, to: 200 })
    expect(r).toEqual({ from: 100, to: 200 })
  })

  it('leaves a range with an open bound untouched', () => {
    expect(normalizeRange({ from: null, to: 200 })).toEqual({ from: null, to: 200 })
    expect(normalizeRange({ from: 100, to: null })).toEqual({ from: 100, to: null })
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

describe('localDateInputValue / parseLocalDateInput round trip', () => {
  it('round-trips a local date without a UTC shift', () => {
    const original = new Date(2026, 8, 27, 0, 0, 0) // Sep 27, local midnight
    const value = localDateInputValue(original.getTime())
    expect(value).toBe('2026-09-27')
    const parsed = parseLocalDateInput(value)
    expect(parsed?.getTime()).toBe(original.getTime())
  })

  it('returns an empty string for null', () => {
    expect(localDateInputValue(null)).toBe('')
  })

  it('returns null for an empty string', () => {
    expect(parseLocalDateInput('')).toBe(null)
  })
})
