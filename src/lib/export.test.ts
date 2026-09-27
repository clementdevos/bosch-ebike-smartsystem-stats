import { describe, it, expect } from 'vitest'
import { toGpx, toActivityJson } from './export'
import type { ActivityDetailPoint, ActivitySummary } from '../server/activities'

const summary: ActivitySummary = {
  id: 'abc123',
  startTime: '2026-01-05T08:00:00Z',
  endTime: '2026-01-05T09:00:00Z',
  timeZone: 'Europe/Berlin',
  durationWithoutStops: 3600,
  title: 'Morning <ride> & coffee',
  bikeId: 'bike1',
  startOdometer: 100,
  distance: 15000,
  speed: { average: 20, maximum: 30 },
  cadence: { average: 60, maximum: 90 },
  riderPower: { average: 100, maximum: 200 },
  elevation: { gain: 50, loss: 40 },
}

const points: ActivityDetailPoint[] = [
  { distance: 0, altitude: 100, speed: 10, cadence: 50, latitude: 48.1, longitude: 11.5, riderPower: 80 },
  { distance: 10, altitude: 101, speed: 12, cadence: 55, latitude: 0, longitude: 0, riderPower: 85 },
  { distance: 20, altitude: 102, speed: 15, cadence: 60, latitude: 48.2, longitude: 11.6, riderPower: 90 },
]

describe('toGpx', () => {
  it('escapes the title and drops points with no GPS fix', () => {
    const gpx = toGpx(summary, points)
    expect(gpx).toContain('Morning &lt;ride&gt; &amp; coffee')
    expect((gpx.match(/<trkpt/g) ?? []).length).toBe(2)
    expect(gpx).toContain('lat="48.1" lon="11.5"')
    expect(gpx).toContain('lat="48.2" lon="11.6"')
    expect(gpx).not.toContain('lat="0" lon="0"')
  })
})

describe('toActivityJson', () => {
  it('round-trips summary and full point list', () => {
    const parsed = JSON.parse(toActivityJson(summary, points)) as {
      summary: ActivitySummary
      activityDetails: ActivityDetailPoint[]
    }
    expect(parsed.summary.id).toBe('abc123')
    expect(parsed.activityDetails).toHaveLength(3)
  })
})
