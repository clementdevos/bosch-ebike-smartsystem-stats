import { useDateRange } from '../lib/date-range-context'
import { presetRange, type PresetKey } from '../lib/date-range'
import { Button } from './ui/button'
import { Input } from './ui/input'

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: '7d' },
  { key: 'mtd', label: 'MTD' },
  { key: 'ytd', label: 'YTD' },
]

function toDateInputValue(ts: number | null) {
  return ts === null ? '' : new Date(ts).toISOString().slice(0, 10)
}

const DAY_MS = 86_400_000

export function DateRangePicker() {
  const { range, setRange, clearRange } = useDateRange()
  const isFiltered = range.from !== null || range.to !== null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESETS.map((p) => (
        <Button
          key={p.key}
          variant="outline"
          size="sm"
          onClick={() => setRange(presetRange(p.key))}
        >
          {p.label}
        </Button>
      ))}
      <Input
        type="date"
        value={toDateInputValue(range.from)}
        onChange={(e) =>
          setRange({ ...range, from: e.target.value ? new Date(e.target.value).getTime() : null })
        }
        className="w-auto"
      />
      <span className="text-xs text-gray-400">to</span>
      <Input
        type="date"
        value={toDateInputValue(range.to)}
        onChange={(e) =>
          setRange({
            ...range,
            to: e.target.value ? new Date(e.target.value).getTime() + DAY_MS - 1 : null,
          })
        }
        className="w-auto"
      />
      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={clearRange}>
          All time
        </Button>
      )}
    </div>
  )
}
