import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../lib/auth-context'
import { type ActivitySummary } from '../server/activities'
import { useBikes } from '../components/data/use-bikes'
import { useActivities } from '../components/data/use-activities'
import { ActivityDetailDrawer } from '../components/activity-detail-drawer'
import { useBikeSelection } from '../lib/bike-selection-context'
import { ActivitiesHeader } from '../components/activities-header'
import { OdometerChart } from '../components/odometer-chart'
import { ActivitiesTable } from '../components/activities-table'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/activities')({
  validateSearch: (search: Record<string, unknown>) => ({
    activityId: typeof search.activityId === 'string' ? search.activityId : undefined,
  }),
  component: ActivitiesPage,
})

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

type ChartEntry = { date: string } & Record<string, string | number>

function buildChartData(activities: ActivitySummary[], enabledIds: Set<string>): ChartEntry[] {
  const byDate = new Map<string, { _ts: number; [bikeId: string]: number }>()
  for (const a of [...activities].sort(
    (x, y) => new Date(x.startTime).getTime() - new Date(y.startTime).getTime()
  )) {
    if (!enabledIds.has(a.bikeId)) continue
    const date = fmtShortDate(a.startTime)
    if (!byDate.has(date)) byDate.set(date, { _ts: new Date(a.startTime).getTime() })
    byDate.get(date)![a.bikeId] = Math.round(a.startOdometer / 1000)
  }
  return [...byDate.entries()]
    .sort(([, a], [, b]) => a._ts - b._ts)
    .map(([date, vals]) => {
      const { _ts, ...rest } = vals
      return { date, ...rest }
    })
}

export default function ActivitiesPage() {
  const { tokenSet, login } = useAuth()
  const { activityId } = Route.useSearch()
  const navigate = useNavigate({ from: '/activities' })
  const { enabledBikeIds, enableAll } = useBikeSelection()

  const { data: bikeData } = useBikes()
  const bikes = useMemo(() => bikeData?.bikes ?? [], [bikeData])

  const {
    data: activitiesData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    error: activitiesError,
    refetch,
    dataUpdatedAt,
  } = useActivities()

  const activities = useMemo(
    () => activitiesData?.pages.flatMap((p) => p.activitySummaries ?? []) ?? [],
    [activitiesData]
  )
  const total = activitiesData?.pages.at(-1)?.pagination.total ?? null
  const initialized = !!activitiesData
  const loading = isLoading || (isFetching && !isFetchingNextPage)
  const loadingMore = isFetchingNextPage
  const error =
    activitiesError instanceof Error
      ? activitiesError.message
      : activitiesError
        ? 'Unknown error'
        : null
  const hasMore = !!hasNextPage

  useEffect(() => {
    if (!activitiesData) return
    const ids = activitiesData.pages.flatMap(
      (page) => page.activitySummaries?.map((a) => a.bikeId) ?? []
    )
    enableAll(ids)
  }, [activitiesData, enableAll])

  const uniqueBikeIds = useMemo(() => [...new Set(activities.map((a) => a.bikeId))], [activities])

  const filteredActivities = useMemo(
    () => activities.filter((a) => enabledBikeIds.has(a.bikeId)),
    [activities, enabledBikeIds]
  )

  const bikeName = useCallback(
    (bikeId: string) => {
      const bike = bikes.find((b) => b.id === bikeId)
      return bike ? (bike.driveUnit.productName ?? bikeId.slice(0, 8)) : bikeId.slice(0, 8)
    },
    [bikes]
  )

  const enabledIds = useMemo(
    () => uniqueBikeIds.filter((id) => enabledBikeIds.has(id)),
    [uniqueBikeIds, enabledBikeIds]
  )

  const chartData = useMemo(
    () => buildChartData(activities, enabledBikeIds),
    [activities, enabledBikeIds]
  )

  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === activityId) ?? null,
    [activities, activityId]
  )

  const openActivity = useCallback(
    (id: string) => {
      navigate({ search: { activityId: id } })
    },
    [navigate]
  )

  const closeActivity = useCallback(() => {
    navigate({ search: { activityId: undefined } })
  }, [navigate])

  if (!tokenSet) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-gray-600">Sign in to view activities.</p>
        <Button onClick={login}>Sign in with Bosch</Button>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <ActivitiesHeader
          uniqueBikeIds={uniqueBikeIds}
          bikeName={bikeName}
          initialized={initialized}
          dataUpdatedAt={dataUpdatedAt}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          total={total}
          loadedCount={activities.length}
          onRefresh={refetch}
          onLoadMore={fetchNextPage}
        />

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        <OdometerChart
          chartData={chartData}
          enabledIds={enabledIds}
          uniqueBikeIds={uniqueBikeIds}
          bikeName={bikeName}
          hasMore={hasMore}
          loadedCount={activities.length}
          total={total}
        />

        {initialized && (
          <ActivitiesTable
            activities={filteredActivities}
            total={total}
            uniqueBikeIds={uniqueBikeIds}
            bikes={bikes}
            onRowClick={openActivity}
          />
        )}
      </div>

      {tokenSet && <ActivityDetailDrawer summary={selectedActivity} onClose={closeActivity} />}
    </>
  )
}
