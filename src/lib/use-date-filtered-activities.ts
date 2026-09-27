import { useMemo } from 'react'
import type { ActivitySummary } from '../server/activities'
import { isWithinRange } from './date-range'
import { useDateRange } from './date-range-context'

export function useDateFilteredActivities(activities: ActivitySummary[]): ActivitySummary[] {
  const { range } = useDateRange()
  return useMemo(
    () => activities.filter((a) => isWithinRange(a.startTime, range)),
    [activities, range]
  )
}
