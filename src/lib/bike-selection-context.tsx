import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface BikeSelectionContextValue {
  enabledBikeIds: Set<string>
  toggleBike: (id: string) => void
  enableAll: (ids: string[]) => void
}

const BikeSelectionContext = createContext<BikeSelectionContextValue | null>(null)

export function BikeSelectionProvider({ children }: { children: ReactNode }) {
  const [enabledBikeIds, setEnabledBikeIds] = useState<Set<string>>(new Set())

  const toggleBike = useCallback((id: string) => {
    setEnabledBikeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const enableAll = useCallback((ids: string[]) => {
    setEnabledBikeIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [])

  return (
    <BikeSelectionContext.Provider value={{ enabledBikeIds, toggleBike, enableAll }}>
      {children}
    </BikeSelectionContext.Provider>
  )
}

export function useBikeSelection() {
  const ctx = useContext(BikeSelectionContext)
  if (!ctx) throw new Error('useBikeSelection must be used within BikeSelectionProvider')
  return ctx
}
