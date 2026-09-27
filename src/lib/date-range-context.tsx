import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type DateRange, type PresetKey, ALL_TIME } from './date-range'

interface DateRangeContextValue {
  range: DateRange
  presetKey: PresetKey | null
  setRange: (range: DateRange, presetKey?: PresetKey | null) => void
  clearRange: () => void
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRangeState] = useState<DateRange>(ALL_TIME)
  const [presetKey, setPresetKey] = useState<PresetKey | null>(null)

  const setRange = useCallback((next: DateRange, preset: PresetKey | null = null) => {
    setRangeState(next)
    setPresetKey(preset)
  }, [])

  const clearRange = useCallback(() => {
    setRangeState(ALL_TIME)
    setPresetKey(null)
  }, [])

  return (
    <DateRangeContext.Provider value={{ range, presetKey, setRange, clearRange }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext)
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider')
  return ctx
}
