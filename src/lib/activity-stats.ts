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

function best(
  activities: ActivitySummary[],
  by: (a: ActivitySummary) => number
): ActivitySummary | null {
  return activities.reduce<ActivitySummary | null>(
    (top, a) => (top === null || by(a) > by(top) ? a : top),
    null
  )
}

export function computeRecords(activities: ActivitySummary[]): ActivityRecord[] {
  const records: ActivityRecord[] = []

  const longest = best(activities, (a) => a.distance)
  if (longest) {
    records.push({
      label: 'Longest ride',
      activity: longest,
      value: `${(longest.distance / 1000).toFixed(1)} km`,
    })
  }

  const fastest = best(activities, (a) => a.speed.average)
  if (fastest) {
    records.push({
      label: 'Fastest avg speed',
      activity: fastest,
      value: `${fastest.speed.average.toFixed(1)} km/h`,
    })
  }

  const mostClimb = best(activities, (a) => a.elevation.gain)
  if (mostClimb) {
    records.push({
      label: 'Most elevation gain',
      activity: mostClimb,
      value: `${mostClimb.elevation.gain} m`,
    })
  }

  const mostCalories = best(activities, (a) => a.caloriesBurned ?? 0)
  if (mostCalories && (mostCalories.caloriesBurned ?? 0) > 0) {
    records.push({
      label: 'Most calories burned',
      activity: mostCalories,
      value: `${Math.round(mostCalories.caloriesBurned!)} kcal`,
    })
  }

  const longestDuration = best(activities, (a) => a.durationWithoutStops)
  if (longestDuration) {
    const h = Math.floor(longestDuration.durationWithoutStops / 3600)
    const m = Math.floor((longestDuration.durationWithoutStops % 3600) / 60)
    records.push({
      label: 'Longest duration',
      activity: longestDuration,
      value: h > 0 ? `${h}h ${m}m` : `${m}m`,
    })
  }

  return records
}
