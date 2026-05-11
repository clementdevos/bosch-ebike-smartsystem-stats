import { useState, useMemo, memo, lazy, Suspense } from 'react'
import { useActivityDetails } from './data/use-activity-details'
import { X } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '#/components/ui/drawer'
import { type ActivityDetailPoint } from '../server/activities'
import type { ActivitySummary } from '../server/activities'

const ActivityMap = lazy(() =>
  import('./activity-map').then((m) => ({ default: m.ActivityMap }))
)

interface Props {
  summary: ActivitySummary | null
  onClose: () => void
}

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type ChartPoint = {
  dist: number
  speed: number
  altitude: number
  power: number
  cadence: number
}

function toChartData(points: ActivityDetailPoint[]): ChartPoint[] {
  return points.map((p) => ({
    dist: Math.round(p.distance / 10) / 100,
    speed: Math.round(p.speed * 10) / 10,
    altitude: Math.round(p.altitude),
    power: Math.round(p.riderPower),
    cadence: Math.round(p.cadence),
  }))
}

const SYNC_ID = 'activity-detail'

const MiniChart = memo(function MiniChart({
  data,
  dataKey,
  label,
  unit,
  color,
  domain,
  onHoverIndex,
}: {
  data: ChartPoint[]
  dataKey: keyof ChartPoint
  label: string
  unit: string
  color: string
  domain?: [number | 'auto', number | 'auto']
  onHoverIndex?: (index: number | null) => void
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={data}
          syncId={SYNC_ID}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          onMouseMove={(e) => onHoverIndex?.(e?.activeTooltipIndex ?? null)}
          onMouseLeave={() => onHoverIndex?.(null)}
        >
          <defs>
            <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="dist"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${v}`}
            label={{ value: 'km', position: 'insideBottomRight', offset: -4, fontSize: 10 }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${v}`}
            width={40}
            domain={domain ?? ['auto', 'auto']}
          />
          <Tooltip
            formatter={(v) => [`${v} ${unit}`, label]}
            labelFormatter={(l) => `${l} km`}
            contentStyle={{ fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#fill-${dataKey})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

const RESOLUTION_STEPS = [1, 10, 20, 30, 40, 50, 60, 90, 120]
const DEFAULT_RES = 10

function downsample<T>(arr: T[], n: number): T[] {
  if (n <= 1) return arr
  return arr.filter((_, i) => i % n === 0)
}

export function ActivityDetailDrawer({ summary, onClose }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [resolution, setResolution] = useState(DEFAULT_RES)

  const { data, isLoading: loading, error: queryError } = useActivityDetails(summary?.id)

  const points = data?.activityDetails ?? []
  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load' : null

  const sampledPoints = useMemo(() => downsample(points, resolution), [points, resolution])
  const chartData = useMemo(() => toChartData(sampledPoints), [sampledPoints])
  const hasPower = useMemo(() => sampledPoints.some((p) => p.riderPower > 0), [sampledPoints])
  const hasCadence = useMemo(() => sampledPoints.some((p) => p.cadence > 0), [sampledPoints])

  return (
    <Drawer open={!!summary} onClose={onClose} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[92vh]">
        <DrawerHeader className="flex flex-row items-start justify-between border-b pb-3">
          <div>
            <DrawerTitle>{summary?.title ?? 'Activity'}</DrawerTitle>
            <DrawerDescription>
              {summary ? fmtDate(summary.startTime) : ''}
            </DrawerDescription>
          </div>
          <div className="flex items-center gap-2">
            {points.length > 0 && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-muted-foreground">Res</label>
                <select
                  value={resolution}
                  onChange={(e) => { setHoveredIndex(null); setResolution(Number(e.target.value)) }}
                  className="text-xs border rounded px-1.5 py-0.5 bg-background"
                >
                  {RESOLUTION_STEPS.map((s) => (
                    <option key={s} value={s}>
                      {s >= 60 ? `${s / 60}min` : `${s}s`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <DrawerClose asChild>
              <button
                onClick={onClose}
                className="rounded-sm p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {summary && (
          <div className="grid grid-cols-4 gap-2 border-b px-4 py-2 text-center text-sm sm:grid-cols-4">
            <Stat label="Distance" value={`${(summary.distance / 1000).toFixed(1)} km`} />
            <Stat label="Duration" value={fmt(summary.durationWithoutStops)} />
            <Stat label="Avg speed" value={`${summary.speed.average.toFixed(1)} km/h`} />
            <Stat label="Elev gain" value={`${summary.elevation.gain} m`} />
          </div>
        )}

        <Suspense
          fallback={
            <div className="flex h-[260px] items-center justify-center bg-muted text-sm text-muted-foreground">
              Loading map…
            </div>
          }
        >
          <ActivityMap
            points={sampledPoints}
            hoveredPoint={hoveredIndex !== null ? sampledPoints[hoveredIndex] : null}
          />
        </Suspense>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {loading && (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Loading detail data…
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {!loading && !error && points.length > 0 && (
            <div className="space-y-6 pb-6">
              <MiniChart
                data={chartData}
                dataKey="speed"
                label="Speed"
                unit="km/h"
                color="#2563eb"
                domain={[0, 'auto']}
                onHoverIndex={setHoveredIndex}
              />
              <MiniChart
                data={chartData}
                dataKey="altitude"
                label="Elevation"
                unit="m"
                color="#16a34a"
                onHoverIndex={setHoveredIndex}
              />
              {hasPower && (
                <MiniChart
                  data={chartData}
                  dataKey="power"
                  label="Rider Power"
                  unit="W"
                  color="#9333ea"
                  domain={[0, 'auto']}
                  onHoverIndex={setHoveredIndex}
                />
              )}
              {hasCadence && (
                <MiniChart
                  data={chartData}
                  dataKey="cadence"
                  label="Cadence"
                  unit="rpm"
                  color="#ea580c"
                  domain={[0, 'auto']}
                  onHoverIndex={setHoveredIndex}
                />
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
