import {useState, useMemo, useEffect, lazy, Suspense} from 'react'
import {useQueries} from '@tanstack/react-query'
import {useAuth} from '../lib/auth-context'
import {useActivities} from './data/use-activities'
import {fetchActivityDetails, type ActivityDetailPoint} from '../server/activities'
import {useBikeSelection} from '../lib/bike-selection-context'
import {Slider} from './ui/slider'
import {Button} from './ui/button'

type HeatPoint = [number, number, number]

const HeatMap = lazy(() => import('./heatmap-map'))

const DAY_MS = 86_400_000
const MIN_RES = 1000
const MAX_RES = 50000
const RES_STEP = 1000
const DEFAULT_RES = 10000

function fmtDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function sampleEvenly<T>(arr: T[], n: number): T[] {
    if (n >= arr.length) return arr
    const step = arr.length / n
    return Array.from({length: n}, (_, i) => arr[Math.floor(i * step)])
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
        return Array.from({length: targetPerActivity}, (_, i) => {
            const p = pts[Math.floor(i * step)]
            return [p.latitude, p.longitude, 0.5] as HeatPoint
        })
    })
}

export function HeatmapTab() {
    const {tokenSet} = useAuth()
    const {
        data: activitiesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingActivities,
    } = useActivities()
    const {enabledBikeIds, enableAll} = useBikeSelection()

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

    const [minTs, maxTs] = useMemo(() => {
        const ts = bikeActivities.map((a) => new Date(a.startTime).getTime())
        return ts.length > 0 ? [Math.min(...ts), Math.max(...ts)] : [0, 0]
    }, [bikeActivities])

    // Stable string key for bike selection — changes trigger date range reset
    const bikeKey = useMemo(() => [...enabledBikeIds].sort().join(','), [enabledBikeIds])

    // null = full range. Stores explicit user selection; expands when new pages load.
    const [dateRange, setDateRange] = useState<[number, number] | null>(null)
    useEffect(() => {
        setDateRange(null)
    }, [bikeKey])

    const dateFromTs = dateRange ? Math.min(dateRange[0], minTs) : minTs
    const dateToTs = dateRange ? Math.max(dateRange[1], maxTs) : maxTs

    const dateFilteredActivities = useMemo(
        () =>
            bikeActivities.filter((a) => {
                const t = new Date(a.startTime).getTime()
                return t >= dateFromTs && t <= dateToTs + DAY_MS
            }),
        [bikeActivities, dateFromTs, dateToTs]
    )

    const [sampleSize, setSampleSize] = useState(50)
    useEffect(() => {
        if (dateFilteredActivities.length > 0)
            setSampleSize((prev) => Math.min(prev, dateFilteredActivities.length))
    }, [dateFilteredActivities.length])

    const [resolution, setResolution] = useState(DEFAULT_RES)

    const sampledActivities = useMemo(
        () => sampleEvenly(dateFilteredActivities, sampleSize),
        [dateFilteredActivities, sampleSize]
    )

    const detailQueries = useQueries({
        queries: sampledActivities.map((a) => ({
            queryKey: ['activity-details', a.id],
            queryFn: () =>
                fetchActivityDetails({data: {accessToken: tokenSet!.accessToken, activityId: a.id}}),
            staleTime: 30 * 60 * 1000,
            enabled: !!tokenSet,
        })),
    })

    const loadedResults = useMemo(
        () =>
            sampledActivities
                .map((a, i) => ({id: a.id, points: detailQueries[i]?.data?.activityDetails ?? []}))
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
            </div>

            {allActivities.length > 0 && minTs < maxTs && (
                <div className="flex items-center gap-3">
                    <span className="text-xs whitespace-nowrap text-gray-500">Date</span>
                    <Slider
                        min={minTs}
                        max={maxTs}
                        step={DAY_MS}
                        value={[dateFromTs, dateToTs]}
                        onValueChange={([from, to]) => {
                            setDateRange([from, to])
                            const filtered = bikeActivities.filter((a) => {
                                const t = new Date(a.startTime).getTime()
                                return t >= from && t <= to + DAY_MS
                            })
                            setSampleSize(Math.max(1, Math.floor(filtered.length / 2)))
                        }}
                        className="flex-1"
                    />
                    <span className="w-44 text-right text-xs whitespace-nowrap text-gray-500">
            {dateFromTs ? fmtDate(dateFromTs) : '—'} – {dateToTs ? fmtDate(dateToTs) : '—'}
          </span>
                </div>
            )}

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
                            <div
                                className="bg-muted text-muted-foreground flex h-[480px] items-center justify-center rounded-lg text-sm">
                                Loading map…
                            </div>
                        }
                    >
                        <HeatMap points={heatPoints}/>
                    </Suspense>
                </>
            )}
        </div>
    )
}
