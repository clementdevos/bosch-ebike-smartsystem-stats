import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react'
import { cn } from '#/lib/utils.ts'
import { useDateRange } from '../lib/date-range-context'
import {
  presetRange,
  startOfDay,
  endOfDay,
  localDateInputValue,
  parseLocalDateInput,
  ALL_TIME,
  type DateRange,
  type PresetKey,
} from '../lib/date-range'
import { Button } from './ui/button'
import { Input } from './ui/input'

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 days' },
  { key: 'mtd', label: 'This month' },
  { key: 'ytd', label: 'This year' },
]

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DAY_MS = 86_400_000

function fmtShort(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function isAllTime(r: DateRange) {
  return r.from === null && r.to === null
}

function triggerLabel(range: DateRange, presetKey: PresetKey | null) {
  if (isAllTime(range)) return 'All time'
  const preset = presetKey ? PRESETS.find((p) => p.key === presetKey) : null
  const span = `${range.from !== null ? fmtShort(range.from) : '…'} – ${range.to !== null ? fmtShort(range.to) : '…'}`
  return preset ? `${preset.label} · ${span}` : span
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

function MonthGrid({
  year,
  month,
  draftRange,
  pendingFrom,
  onDayClick,
  className,
}: {
  year: number
  month: number
  draftRange: DateRange
  pendingFrom: number | null
  onDayClick: (ts: number) => void
  className?: string
}) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-gray-400">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />
          const dayStart = new Date(year, month, day).getTime()
          const dayEnd = dayStart + DAY_MS - 1
          const from = pendingFrom ?? draftRange.from
          const to = pendingFrom !== null ? null : draftRange.to
          const inRange = from !== null && to !== null && dayStart >= from && dayEnd <= to
          const isEndpoint =
            (from !== null && dayStart === startOfDay(new Date(from)).getTime()) ||
            (to !== null && dayEnd === to)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(dayStart)}
              className={cn(
                'mx-auto flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100',
                inRange && 'bg-emerald-50',
                isEndpoint && 'bg-emerald-500 text-white hover:bg-emerald-500'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DateRangePicker() {
  const { range, presetKey, setRange } = useDateRange()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [draftRange, setDraftRange] = useState<DateRange>(range)
  const [draftPreset, setDraftPreset] = useState<PresetKey | null>(presetKey)
  const [pendingFrom, setPendingFrom] = useState<number | null>(null)
  const [baseMonth, setBaseMonth] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function openPicker() {
    setDraftRange(range)
    setDraftPreset(presetKey)
    setPendingFrom(null)
    setOpen(true)
  }

  function pickPreset(key: PresetKey) {
    setDraftRange(presetRange(key))
    setDraftPreset(key)
    setPendingFrom(null)
  }

  function pickAllTime() {
    setDraftRange(ALL_TIME)
    setDraftPreset(null)
    setPendingFrom(null)
  }

  function handleDayClick(dayStart: number) {
    setDraftPreset(null)
    if (pendingFrom === null) {
      setPendingFrom(dayStart)
      setDraftRange({ from: dayStart, to: null })
    } else {
      const from = Math.min(pendingFrom, dayStart)
      const to = Math.max(pendingFrom, dayStart)
      setDraftRange({ from, to: to + DAY_MS - 1 })
      setPendingFrom(null)
    }
  }

  function apply() {
    setRange(draftRange, draftPreset)
    setOpen(false)
  }

  const next = addMonths(baseMonth.year, baseMonth.month, 1)
  const isDraftAllTime = isAllTime(draftRange)

  return (
    <div className="relative inline-block" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="gap-1.5"
      >
        {triggerLabel(range, presetKey)}
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <div className="fixed inset-x-4 top-20 z-20 flex max-h-[calc(100vh-6rem)] flex-col gap-4 overflow-y-auto rounded-lg border bg-white p-4 shadow-lg min-[500px]:absolute min-[500px]:inset-x-auto min-[500px]:top-auto min-[500px]:right-0 min-[500px]:mt-2 min-[500px]:max-h-none min-[500px]:w-[540px] min-[500px]:flex-row min-[500px]:overflow-visible dark:bg-slate-900">
          <div className="flex shrink-0 flex-col gap-0.5 border-b pb-3 min-[500px]:w-36 min-[500px]:border-r min-[500px]:border-b-0 min-[500px]:pr-3 min-[500px]:pb-0">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => pickPreset(p.key)}
                className={cn(
                  'flex items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50',
                  draftPreset === p.key && 'bg-gray-100 font-medium'
                )}
              >
                {p.label}
                {draftPreset === p.key && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
            <button
              type="button"
              onClick={pickAllTime}
              className={cn(
                'flex items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50',
                isDraftAllTime && 'bg-gray-100 font-medium'
              )}
            >
              All time
              {isDraftAllTime && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBaseMonth((m) => addMonths(m.year, m.month, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center text-sm font-medium">
                {monthLabel(baseMonth.year, baseMonth.month)}
              </span>
              <span className="hidden flex-1 text-center text-sm font-medium min-[500px]:block">
                {monthLabel(next.year, next.month)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBaseMonth((m) => addMonths(m.year, m.month, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-4">
              <MonthGrid
                year={baseMonth.year}
                month={baseMonth.month}
                draftRange={draftRange}
                pendingFrom={pendingFrom}
                onDayClick={handleDayClick}
              />
              <MonthGrid
                year={next.year}
                month={next.month}
                draftRange={draftRange}
                pendingFrom={pendingFrom}
                onDayClick={handleDayClick}
                className="hidden min-[500px]:block"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <Input
                type="date"
                value={localDateInputValue(draftRange.from)}
                onChange={(e) => {
                  setDraftPreset(null)
                  const d = parseLocalDateInput(e.target.value)
                  setDraftRange((r) => ({ ...r, from: d ? startOfDay(d).getTime() : null }))
                }}
                className="w-auto"
              />
              <span className="text-xs text-gray-400">to</span>
              <Input
                type="date"
                value={localDateInputValue(draftRange.to)}
                onChange={(e) => {
                  setDraftPreset(null)
                  const d = parseLocalDateInput(e.target.value)
                  setDraftRange((r) => ({ ...r, to: d ? endOfDay(d).getTime() : null }))
                }}
                className="w-auto"
              />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={apply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
