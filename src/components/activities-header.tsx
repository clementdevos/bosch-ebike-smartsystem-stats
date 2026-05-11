import { RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { badgeVariants } from './ui/badge'
import { useBikeSelection } from '../lib/bike-selection-context'

const BIKE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c']

interface Props {
  uniqueBikeIds: string[]
  bikeName: (id: string) => string
  initialized: boolean
  dataUpdatedAt: number
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  total: number | null
  loadedCount: number
  onRefresh: () => void
  onLoadMore: () => void
}

export function ActivitiesHeader({
  uniqueBikeIds,
  bikeName,
  initialized,
  dataUpdatedAt,
  loading,
  loadingMore,
  hasMore,
  total,
  loadedCount,
  onRefresh,
  onLoadMore,
}: Props) {
  const { enabledBikeIds, toggleBike } = useBikeSelection()

  return (
    <div className="flex flex-wrap items-center gap-6">
      <h1 className="text-3xl font-bold">Activities</h1>

      {uniqueBikeIds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {uniqueBikeIds.map((id, i) => {
            const enabled = enabledBikeIds.has(id)
            const color = BIKE_COLORS[i % BIKE_COLORS.length]
            return (
              <button
                key={id}
                onClick={() => toggleBike(id)}
                className={
                  badgeVariants({ variant: 'outline' }) +
                  ' cursor-pointer px-3 py-1 text-sm transition-opacity'
                }
                style={{
                  borderColor: color,
                  backgroundColor: enabled ? color : 'transparent',
                  color: enabled ? '#fff' : color,
                  opacity: enabled ? 1 : 0.5,
                }}
              >
                {bikeName(id)}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex w-full flex-wrap items-center gap-3 min-[500px]:ml-auto min-[500px]:w-auto">
        {initialized && dataUpdatedAt > 0 && (
          <p className="text-xs text-gray-400">
            Updated{' '}
            {new Date(dataUpdatedAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        )}
        {initialized && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="max-w-full truncate"
          >
            {loadingMore ? 'Loading…' : `Load more (${total! - loadedCount} remaining)`}
          </Button>
        )}
      </div>
    </div>
  )
}
