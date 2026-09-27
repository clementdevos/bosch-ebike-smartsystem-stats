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

export function endOfDay(d: Date): Date {
  return new Date(startOfDay(d).getTime() + DAY_MS - 1)
}

export function presetRange(key: PresetKey, now = new Date()): DateRange {
  const todayEnd = endOfDay(now).getTime()
  switch (key) {
    case 'today':
      return { from: startOfDay(now).getTime(), to: todayEnd }
    case 'yesterday': {
      const y = startOfDay(new Date(now.getTime() - DAY_MS))
      return { from: y.getTime(), to: y.getTime() + DAY_MS - 1 }
    }
    case '7d':
      return { from: todayEnd - 7 * DAY_MS + 1, to: todayEnd }
    case 'mtd':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), to: todayEnd }
    case 'ytd':
      return { from: new Date(now.getFullYear(), 0, 1).getTime(), to: todayEnd }
  }
}

export function isWithinRange(iso: string, range: DateRange): boolean {
  if (range.from === null && range.to === null) return true
  const t = new Date(iso).getTime()
  if (range.from !== null && t < range.from) return false
  if (range.to !== null && t > range.to) return false
  return true
}

/** Local (not UTC) yyyy-mm-dd, for <input type="date"> value. */
export function localDateInputValue(ts: number | null): string {
  if (ts === null) return ''
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parses an <input type="date"> value as a local (not UTC) date. */
export function parseLocalDateInput(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}
