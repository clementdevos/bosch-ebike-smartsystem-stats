import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useAuth } from '../lib/auth-context'
import { useActivities } from './data/use-activities'
import { fetchActivityDetails, type ActivityDetailPoint } from '../server/activities'
import { useBikeSelection } from '../lib/bike-selection-context'
import { useDateRange } from '../lib/date-range-context'
import { isWithinRange } from '../lib/date-range'
import { DateRangePicker } from './date-range-picker'
import { Slider } from './ui/slider'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

type HeatPoint = [number, number, number]

const HeatMap = lazy(() => import('./heatmap-map'))

const MIN_RES = 1000
const MAX_RES = 50000
const RES_STEP = 1000
const DEFAULT_RES = 10000

function sampleEvenly<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return arr
  const step = arr.length / n
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)])
}

function buildHeatPoints(
  results: { id: string; points: ActivityDetailPoint[] }[],
  resolution: number
): HeatPoint[] {
  const activities = results
    .map((r) => r.points.filter((p) => p.latitude !== 0 && p.longitude !== 0))
    .filter((pts) => pts.length > 0)

  if (activities.length === 0) return []

  const targetPerActivity = Math.max(1, Math.floor(resolution / activities.length))

  return activities.flatMap((pts) => {
    if (pts.length <= targetPerActivity)
      return pts.map((p) => [p.latitude, p.longitude, 0.5] as HeatPoint)
    const step = pts.length / targetPerActivity
    return Array.from({ length: targetPerActivity }, (_, i) => {
      const p = pts[Math.floor(i * step)]
      return [p.latitude, p.longitude, 0.5] as HeatPoint
    })
  })
}

export function HeatmapTab() {
  const { isAuthenticated } = useAuth()
  const {
    data: activitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingActivities,
  } = useActivities()
  const { enabledBikeIds, enableAll } = useBikeSelection()
  const { range } = useDateRange()

  const allActivities = activitiesData?.pages.flatMap((p) => p.activitySummaries ?? []) ?? []

  useEffect(() => {
    if (!activitiesData) return
    const ids = activitiesData.pages.flatMap(
      (page) => page.activitySummaries?.map((a) => a.bikeId) ?? []
    )
    enableAll(ids)
  }, [activitiesData, enableAll])
  const bikeActivities = useMemo(
    () => allActivities.filter((a) => enabledBikeIds.has(a.bikeId)),
    [allActivities, enabledBikeIds]
  )

  const dateFilteredActivities = useMemo(
    () => bikeActivities.filter((a) => isWithinRange(a.startTime, range)),
    [bikeActivities, range]
  )

  const [sampleSize, setSampleSize] = useState(50)
  // Reset to a fresh default whenever the shared date range changes, rather
  // than only ever shrinking — otherwise a narrow range followed by a wider
  // one leaves the sample stuck at whatever it shrank to.
  useEffect(() => {
    setSampleSize(Math.max(1, Math.min(50, dateFilteredActivities.length || 1)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const [resolution, setResolution] = useState(DEFAULT_RES)

  const sampledActivities = useMemo(
    () => sampleEvenly(dateFilteredActivities, sampleSize),
    [dateFilteredActivities, sampleSize]
  )

  const detailQueries = useQueries({
    queries: sampledActivities.map((a) => ({
      queryKey: ['activity-details', a.id],
      queryFn: () => fetchActivityDetails({ data: { activityId: a.id } }),
      staleTime: 30 * 60 * 1000,
      enabled: isAuthenticated,
    })),
  })

  const loadedResults = useMemo(
    () =>
      sampledActivities
        .map((a, i) => ({ id: a.id, points: detailQueries[i]?.data?.activityDetails ?? [] }))
        .filter((r) => r.points.length > 0),
    [sampledActivities, detailQueries]
  )

  const heatPoints = useMemo(
    () => buildHeatPoints(loadedResults, resolution),
    [loadedResults, resolution]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-400">
          {isLoadingActivities
            ? 'Loading activities…'
            : allActivities.length === 0
              ? 'No activities loaded.'
              : `${loadedResults.length} activities · ${heatPoints.length} pts`}
        </p>
        {isLoadingActivities && (
          <div className="w-full space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-[480px] w-full rounded-lg" />
          </div>
        )}
        {hasNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more activities'}
          </Button>
        )}
        {allActivities.length > 0 && <DateRangePicker />}
      </div>

      {allActivities.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-xs whitespace-nowrap text-gray-500">Sample</span>
            <Slider
              min={1}
              max={dateFilteredActivities.length || 1}
              step={1}
              value={[sampleSize]}
              onValueChange={([v]) => setSampleSize(v)}
              className="flex-1"
            />
            <span className="w-24 text-right text-xs whitespace-nowrap text-gray-500">
              {sampleSize} / {dateFilteredActivities.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs whitespace-nowrap text-gray-500">Resolution</span>
            <Slider
              min={MIN_RES}
              max={MAX_RES}
              step={RES_STEP}
              value={[resolution]}
              onValueChange={([v]) => setResolution(v)}
              className="flex-1"
            />
            <span className="w-20 text-right text-xs whitespace-nowrap text-gray-500">
              {resolution.toLocaleString()} pts
            </span>
          </div>

          <Suspense
            fallback={
              <div className="bg-muted text-muted-foreground flex h-[480px] items-center justify-center rounded-lg text-sm">
                Loading map…
              </div>
            }
          >
            <HeatMap points={heatPoints} />
          </Suspense>
        </>
      )}
    </div>
  )
}
