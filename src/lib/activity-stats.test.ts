import { describe, it, expect } from 'vitest'
import { computeTotals, computeRecords } from './activity-stats'
import type { ActivitySummary } from '../server/activities'

function makeActivity(overrides: Partial<ActivitySummary>): ActivitySummary {
  return {
    id: overrides.id ?? 'a',
    startTime: '2026-01-05T08:00:00Z',
    endTime: '2026-01-05T09:00:00Z',
    timeZone: 'Europe/Berlin',
    durationWithoutStops: 3600,
    bikeId: 'bike1',
    startOdometer: 0,
    distance: 10000,
    speed: { average: 20, maximum: 30 },
    cadence: { average: 60, maximum: 90 },
    riderPower: { average: 100, maximum: 200 },
    elevation: { gain: 50, loss: 40 },
    ...overrides,
  }
}

describe('computeTotals', () => {
  it('sums distance, duration, elevation gain, and calories across activities', () => {
    const totals = computeTotals([
      makeActivity({ distance: 10000, durationWithoutStops: 1800, caloriesBurned: 300 }),
      makeActivity({ distance: 5000, durationWithoutStops: 900, caloriesBurned: 150 }),
    ])
    expect(totals).toEqual({
      count: 2,
      distance: 15000,
      duration: 2700,
      elevationGain: 100,
      calories: 450,
    })
  })

  it('treats a missing caloriesBurned as zero', () => {
    const totals = computeTotals([makeActivity({ caloriesBurned: undefined })])
    expect(totals.calories).toBe(0)
  })

  it('returns zeroed totals for an empty list', () => {
    expect(computeTotals([])).toEqual({
      count: 0,
      distance: 0,
      duration: 0,
      elevationGain: 0,
      calories: 0,
    })
  })
})

describe('computeRecords', () => {
  it('picks the activity with the highest value per record', () => {
    const short = makeActivity({ id: 'short', distance: 5000, speed: { average: 25, maximum: 40 } })
    const long = makeActivity({ id: 'long', distance: 20000, speed: { average: 15, maximum: 25 } })
    const records = computeRecords([short, long])

    expect(records.find((r) => r.label === 'Longest ride')?.activity.id).toBe('long')
    expect(records.find((r) => r.label === 'Fastest avg speed')?.activity.id).toBe('short')
  })

  it('omits the calories record when no activity has calorie data', () => {
    const records = computeRecords([makeActivity({ caloriesBurned: undefined })])
    expect(records.find((r) => r.label === 'Most calories burned')).toBeUndefined()
  })

  it('returns an empty list for no activities', () => {
    expect(computeRecords([])).toEqual([])
  })
})
