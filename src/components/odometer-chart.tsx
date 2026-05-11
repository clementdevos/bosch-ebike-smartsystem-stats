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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const BIKE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c']

type ChartEntry = { date: string } & Record<string, string | number>

interface Props {
  chartData: ChartEntry[]
  enabledIds: string[]
  uniqueBikeIds: string[]
  bikeName: (id: string) => string
  hasMore: boolean
  loadedCount: number
  total: number | null
}

export function OdometerChart({
  chartData,
  enabledIds,
  uniqueBikeIds,
  bikeName,
  hasMore,
  loadedCount,
  total,
}: Props) {
  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Odometer over time</CardTitle>
        {hasMore && (
          <p className="text-xs text-gray-400">
            Chart shows {loadedCount} of {total} activities — load more to extend range
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
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
      </CardContent>
    </Card>
  )
}
