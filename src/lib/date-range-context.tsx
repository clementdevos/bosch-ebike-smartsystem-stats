import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type DateRange, ALL_TIME } from './date-range'

interface DateRangeContextValue {
  range: DateRange
  setRange: (range: DateRange) => void
  clearRange: () => void
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>(ALL_TIME)
  const clearRange = useCallback(() => setRange(ALL_TIME), [])

  return (
    <DateRangeContext.Provider value={{ range, setRange, clearRange }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext)
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider')
  return ctx
}
