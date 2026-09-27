import type { ActivitySummary } from '../server/activities'

export interface ActivityTotals {
  count: number
  distance: number
  duration: number
  elevationGain: number
  calories: number
}

export function computeTotals(activities: ActivitySummary[]): ActivityTotals {
  return activities.reduce(
    (acc, a) => ({
      count: acc.count + 1,
      distance: acc.distance + a.distance,
      duration: acc.duration + a.durationWithoutStops,
      elevationGain: acc.elevationGain + a.elevation.gain,
      calories: acc.calories + (a.caloriesBurned ?? 0),
    }),
    { count: 0, distance: 0, duration: 0, elevationGain: 0, calories: 0 }
  )
}

export interface ActivityRecord {
  label: string
  activity: ActivitySummary
  value: string
}

interface RecordTracker {
  longestDistance: ActivitySummary | null
  fastestAvgSpeed: ActivitySummary | null
  mostElevationGain: ActivitySummary | null
  mostCalories: ActivitySummary | null
  longestDuration: ActivitySummary | null
}

function keepBest(
  current: ActivitySummary | null,
  candidate: ActivitySummary,
  by: (a: ActivitySummary) => number
): ActivitySummary {
  if (current === null || by(candidate) > by(current)) {
    return candidate
  }
  return current
}

export function computeRecords(activities: ActivitySummary[]): ActivityRecord[] {
  const best = activities.reduce<RecordTracker>(
    (acc, a) => ({
      longestDistance: keepBest(acc.longestDistance, a, (x) => x.distance),
      fastestAvgSpeed: keepBest(acc.fastestAvgSpeed, a, (x) => x.speed.average),
      mostElevationGain: keepBest(acc.mostElevationGain, a, (x) => x.elevation.gain),
      mostCalories: keepBest(acc.mostCalories, a, (x) => x.caloriesBurned ?? 0),
      longestDuration: keepBest(acc.longestDuration, a, (x) => x.durationWithoutStops),
    }),
    {
      longestDistance: null,
      fastestAvgSpeed: null,
      mostElevationGain: null,
      mostCalories: null,
      longestDuration: null,
    }
  )

  const records: ActivityRecord[] = []

  if (best.longestDistance) {
    records.push({
      label: 'Longest ride',
      activity: best.longestDistance,
      value: `${(best.longestDistance.distance / 1000).toFixed(1)} km`,
    })
  }

  if (best.fastestAvgSpeed) {
    records.push({
      label: 'Fastest avg speed',
      activity: best.fastestAvgSpeed,
      value: `${best.fastestAvgSpeed.speed.average.toFixed(1)} km/h`,
    })
  }

  if (best.mostElevationGain) {
    records.push({
      label: 'Most elevation gain',
      activity: best.mostElevationGain,
      value: `${best.mostElevationGain.elevation.gain} m`,
    })
  }

  if (best.mostCalories && (best.mostCalories.caloriesBurned ?? 0) > 0) {
    records.push({
      label: 'Most calories burned',
      activity: best.mostCalories,
      value: `${Math.round(best.mostCalories.caloriesBurned!)} kcal`,
    })
  }

  if (best.longestDuration) {
    const h = Math.floor(best.longestDuration.durationWithoutStops / 3600)
    const m = Math.floor((best.longestDuration.durationWithoutStops % 3600) / 60)
    records.push({
      label: 'Longest duration',
      activity: best.longestDuration,
      value: h > 0 ? `${h}h ${m}m` : `${m}m`,
    })
  }

  return records
}
