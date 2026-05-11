import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useAuth } from '../lib/auth-context'
import { fetchActivitiesPage, type ActivitySummary } from '../server/activities'
import { fetchBikes, type Bike } from '../server/bikes'

export const Route = createFileRoute('/activities')({ component: ActivitiesPage })

const BIKE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c']
const PAGE_SIZE = 20

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
}

function buildChartData(activities: ActivitySummary[], enabledIds: Set<string>) {
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
  const [activities, setActivities] = useState<ActivitySummary[]>([])
  const [bikes, setBikes] = useState<Bike[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [enabledBikeIds, setEnabledBikeIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (tokenSet) load()
  }, [tokenSet])

  async function load() {
    if (!tokenSet) return
    setLoading(true)
    setError(null)
    try {
      const [pageData, bikeData] = await Promise.all([
        fetchActivitiesPage({ data: { accessToken: tokenSet.accessToken, offset: 0, limit: PAGE_SIZE } }),
        fetchBikes({ data: tokenSet.accessToken }),
      ])
      const summaries = pageData.activitySummaries ?? []
      setActivities(summaries)
      setTotal(pageData.pagination.total)
      setBikes(bikeData.bikes ?? [])
      setEnabledBikeIds(new Set(summaries.map((a) => a.bikeId)))
      setInitialized(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!tokenSet) return
    setLoadingMore(true)
    setError(null)
    try {
      const pageData = await fetchActivitiesPage({
        data: { accessToken: tokenSet.accessToken, offset: activities.length, limit: PAGE_SIZE },
      })
      const newSummaries = pageData.activitySummaries ?? []
      setActivities((prev) => [...prev, ...newSummaries])
      setTotal(pageData.pagination.total)
      setEnabledBikeIds((prev) => {
        const next = new Set(prev)
        newSummaries.forEach((a) => next.add(a.bikeId))
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingMore(false)
    }
  }

  function toggleBike(id: string) {
    setEnabledBikeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!tokenSet) {
    return (
      <div className="p-8 flex flex-col items-center gap-4">
        <p className="text-gray-600">Sign in to view activities.</p>
        <button onClick={login} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Sign in with Bosch
        </button>
      </div>
    )
  }

  function bikeName(bikeId: string) {
    const bike = bikes.find((b) => b.id === bikeId)
    return bike ? (bike.driveUnit.productName ?? bikeId.slice(0, 8)) : bikeId.slice(0, 8)
  }

  const uniqueBikeIds = [...new Set(activities.map((a) => a.bikeId))]
  const enabledIds = [...uniqueBikeIds].filter((id) => enabledBikeIds.has(id))
  const chartData = buildChartData(activities, enabledBikeIds)
  const hasMore = total !== null && activities.length < total

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Activities</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : initialized ? 'Refresh' : 'Load activities'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
      )}

      {chartData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Odometer over time</h2>
            {uniqueBikeIds.length > 1 && (
              <div className="flex gap-2">
                {uniqueBikeIds.map((id, i) => {
                  const enabled = enabledBikeIds.has(id)
                  return (
                    <button
                      key={id}
                      onClick={() => toggleBike(id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-opacity"
                      style={{
                        borderColor: BIKE_COLORS[i % BIKE_COLORS.length],
                        backgroundColor: enabled ? BIKE_COLORS[i % BIKE_COLORS.length] : 'transparent',
                        color: enabled ? '#fff' : BIKE_COLORS[i % BIKE_COLORS.length],
                        opacity: enabled ? 1 : 0.5,
                      }}
                    >
                      {bikeName(id)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          {hasMore && (
            <p className="text-xs text-gray-400">
              Chart shows {activities.length} of {total} activities — load more to extend range
            </p>
          )}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} km`} width={68} />
              <Tooltip
                formatter={(value, name) => [`${value} km`, bikeName(name as string)]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {enabledIds.length > 1 && <Legend formatter={(id) => bikeName(id)} />}
              {enabledIds.map((id) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  stroke={BIKE_COLORS[uniqueBikeIds.indexOf(id) % BIKE_COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {initialized && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {activities.length} of {total} activit{total === 1 ? 'y' : 'ies'}
            </h2>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : `Load more (${total! - activities.length} remaining)`}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Title</th>
                  {uniqueBikeIds.length > 1 && <th className="pb-2 pr-4 font-medium">Bike</th>}
                  <th className="pb-2 pr-4 font-medium text-right">Distance</th>
                  <th className="pb-2 pr-4 font-medium text-right">Duration</th>
                  <th className="pb-2 pr-4 font-medium text-right">Avg speed</th>
                  <th className="pb-2 pr-4 font-medium text-right">Odometer</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-500">{fmtDate(a.startTime)}</td>
                    <td className="py-2 pr-4">{a.title ?? '—'}</td>
                    {uniqueBikeIds.length > 1 && (
                      <td className="py-2 pr-4 text-gray-500">{bikeName(a.bikeId)}</td>
                    )}
                    <td className="py-2 pr-4 text-right">{(a.distance / 1000).toFixed(1)} km</td>
                    <td className="py-2 pr-4 text-right">{fmt(a.durationWithoutStops)}</td>
                    <td className="py-2 pr-4 text-right">{a.speed.average.toFixed(1)} km/h</td>
                    <td className="py-2 pr-4 text-right font-mono">{(a.startOdometer / 1000).toFixed(0)} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : `Load more (${total! - activities.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
