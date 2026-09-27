export interface DateRange {
  from: number | null
  to: number | null
}

export type PresetKey = 'today' | 'yesterday' | '7d' | 'mtd' | 'ytd'

export const ALL_TIME: DateRange = { from: null, to: null }

const DAY_MS = 86_400_000

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/**
 * End of the calendar day (23:59:59.999 local time). Uses setDate rather than
 * +DAY_MS so DST transition days (23h or 25h long) still land at local
 * midnight of the next day, not a fixed 24h later.
 */
export function endOfDay(d: Date): Date {
  const next = startOfDay(d)
  next.setDate(next.getDate() + 1)
  return new Date(next.getTime() - 1)
}

export function presetRange(key: PresetKey, now = new Date()): DateRange {
  const todayEnd = endOfDay(now).getTime()
  switch (key) {
    case 'today': {
      return { from: startOfDay(now).getTime(), to: todayEnd }
    }
    case 'yesterday': {
      const y = startOfDay(new Date(now.getTime() - DAY_MS))
      return { from: y.getTime(), to: endOfDay(y).getTime() }
    }
    case '7d': {
      const from = startOfDay(now)
      from.setDate(from.getDate() - 6)
      return { from: from.getTime(), to: todayEnd }
    }
    case 'mtd': {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), to: todayEnd }
    }
    case 'ytd': {
      return { from: new Date(now.getFullYear(), 0, 1).getTime(), to: todayEnd }
    }
  }
}

export function isWithinRange(iso: string, range: DateRange): boolean {
  if (range.from === null && range.to === null) {
    return true
  }
  const t = new Date(iso).getTime()
  if (range.from !== null && t < range.from) {
    return false
  }
  if (range.to !== null && t > range.to) {
    return false
  }
  return true
}

/** Swaps from/to if both are set and out of order. */
export function normalizeRange(range: DateRange): DateRange {
  if (range.from !== null && range.to !== null && range.from > range.to) {
    return { from: range.to, to: range.from }
  }
  return range
}

/** Local (not UTC) yyyy-mm-dd, for <input type="date"> value. */
export function localDateInputValue(ts: number | null): string {
  if (ts === null) {
    return ''
  }
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parses an <input type="date"> value as a local (not UTC) date. */
export function parseLocalDateInput(value: string): Date | null {
  if (!value) {
    return null
  }
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}
