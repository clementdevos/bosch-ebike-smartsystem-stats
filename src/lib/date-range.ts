export interface DateRange {
  from: number | null
  to: number | null
}

export type PresetKey = 'today' | 'yesterday' | '7d' | 'mtd' | 'ytd'

export const ALL_TIME: DateRange = { from: null, to: null }

const DAY_MS = 86_400_000

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function presetRange(key: PresetKey, now = new Date()): DateRange {
  switch (key) {
    case 'today':
      return { from: startOfDay(now).getTime(), to: now.getTime() }
    case 'yesterday': {
      const from = startOfDay(new Date(now.getTime() - DAY_MS))
      return { from: from.getTime(), to: from.getTime() + DAY_MS - 1 }
    }
    case '7d':
      return { from: now.getTime() - 7 * DAY_MS, to: now.getTime() }
    case 'mtd':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), to: now.getTime() }
    case 'ytd':
      return { from: new Date(now.getFullYear(), 0, 1).getTime(), to: now.getTime() }
  }
}

export function isWithinRange(iso: string, range: DateRange): boolean {
  if (range.from === null && range.to === null) return true
  const t = new Date(iso).getTime()
  if (range.from !== null && t < range.from) return false
  if (range.to !== null && t > range.to) return false
  return true
}
