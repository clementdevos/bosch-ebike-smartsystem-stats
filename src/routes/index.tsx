import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../lib/auth-context'
import { useActivities } from '../components/data/use-activities'
import { useBikes } from '../components/data/use-bikes'
import { useBikeSelection } from '../lib/bike-selection-context'
import { computeTotals, computeRecords } from '../lib/activity-stats'
import { ActivitiesHeader } from '../components/activities-header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({ component: StatsPage })

const PRELOAD_TARGET = 50

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function StatsPage() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth()
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

  useEffect(() => {
    if (!activitiesData) return
    const ids = activitiesData.pages.flatMap(
      (page) => page.activitySummaries?.map((a) => a.bikeId) ?? []
    )
    enableAll(ids)
  }, [activitiesData, enableAll])

  // First visit lands here with an empty cache — top up to a useful sample
  // size instead of showing stats for just the first page.
  useEffect(() => {
    if (activities.length < PRELOAD_TARGET && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [activities.length, hasNextPage, isFetchingNextPage, fetchNextPage])

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

  const totals = useMemo(() => computeTotals(filteredActivities), [filteredActivities])
  const records = useMemo(() => computeRecords(filteredActivities), [filteredActivities])

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <Skeleton className="h-9 w-40" />
        <StatsSkeleton />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <h1 className="text-3xl font-bold">Bosch eBike Stats</h1>
        <p className="text-gray-500">Sign in to view your eBike data.</p>
        <Button onClick={login}>Sign in with Bosch</Button>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <p className="mb-2 font-medium text-slate-700 dark:text-slate-300">
            Session &amp; security
          </p>
          <ul className="space-y-1.5">
            <li>
              Auth uses <strong>OAuth 2.0 + PKCE</strong> via Bosch SingleKey ID — no password is
              ever handled by this app.
            </li>
            <li>
              Tokens are stored in an <strong>encrypted, HttpOnly server-side cookie</strong>. They
              are never exposed to the browser or JavaScript.
            </li>
            <li>
              The cookie is encrypted with AES-GCM using a server-only secret. Even if the cookie is
              intercepted, the raw tokens cannot be read.
            </li>
            <li>
              Session lasts up to <strong>30 days</strong>. The access token is automatically
              refreshed server-side before it expires — no re-login needed.
            </li>
            <li>
              No eBike data, tokens, or personal information is stored in any database. The server
              logs nothing.
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <ActivitiesHeader
        title="Stats"
        uniqueBikeIds={uniqueBikeIds}
        bikeName={bikeName}
        initialized={initialized}
        dataUpdatedAt={dataUpdatedAt}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={!!hasNextPage}
        total={total}
        loadedCount={activities.length}
        onRefresh={refetch}
        onLoadMore={fetchNextPage}
      />

      {!initialized ? (
        <StatsSkeleton />
      ) : filteredActivities.length === 0 ? (
        <p className="text-gray-500">No activities loaded yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Total distance" value={`${(totals.distance / 1000).toFixed(0)} km`} />
            <StatTile label="Total time" value={fmtDuration(totals.duration)} />
            <StatTile
              label="Total elevation gain"
              value={`${Math.round(totals.elevationGain)} m`}
            />
            <StatTile
              label="Total calories"
              value={totals.calories > 0 ? `${Math.round(totals.calories)} kcal` : '—'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Personal records</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {records.map((r) => (
                <Link
                  key={r.label}
                  to="/activities"
                  search={{ activityId: r.activity.id }}
                  className="flex items-center justify-between px-6 py-3 text-sm hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{r.label}</p>
                    <p className="text-xs text-gray-500">
                      {bikeName(r.activity.bikeId)} ·{' '}
                      {new Date(r.activity.startTime).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="font-semibold">{r.value}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
