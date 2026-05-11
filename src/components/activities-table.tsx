import { useState, useMemo, useCallback } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import { type ActivitySummary } from '../server/activities'
import type { Bike } from '../server/bikes'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

interface Props {
  activities: ActivitySummary[]
  total: number | null
  uniqueBikeIds: string[]
  bikes: Bike[]
  onRowClick: (id: string) => void
}

const colHelper = createColumnHelper<ActivitySummary>()

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ActivitiesTable({ activities, total, uniqueBikeIds, bikes, onRowClick }: Props) {
  const queryClient = useQueryClient()
  const showBikeCol = uniqueBikeIds.length > 1

  const bikeName = useCallback(
    (bikeId: string) => {
      const bike = bikes.find((b) => b.id === bikeId)
      return bike ? (bike.driveUnit.productName ?? bikeId.slice(0, 8)) : bikeId.slice(0, 8)
    },
    [bikes]
  )

  const columns = useMemo(
    () => [
      colHelper.accessor('startTime', {
        header: 'Date',
        cell: (i) => fmtDate(i.getValue()),
        sortingFn: 'datetime',
      }),
      colHelper.accessor('title', {
        header: 'Title',
        cell: (i) => i.getValue() ?? '—',
        enableSorting: false,
      }),
      ...(showBikeCol
        ? [
            colHelper.accessor('bikeId', {
              header: 'Bike',
              cell: (i) => bikeName(i.getValue()),
              enableSorting: false,
            }),
          ]
        : []),
      colHelper.accessor('distance', {
        header: 'Distance',
        cell: (i) => `${(i.getValue() / 1000).toFixed(1)} km`,
        meta: { align: 'right' },
      }),
      colHelper.accessor('durationWithoutStops', {
        header: 'Duration',
        cell: (i) => fmt(i.getValue()),
        meta: { align: 'right' },
      }),
      colHelper.accessor((row) => row.speed.average, {
        id: 'avgSpeed',
        header: 'Avg speed',
        cell: (i) => `${i.getValue().toFixed(1)} km/h`,
        meta: { align: 'right' },
      }),
      colHelper.accessor('startOdometer', {
        header: 'Odometer',
        cell: (i) => `${(i.getValue() / 1000).toFixed(0)} km`,
        meta: { align: 'right' },
      }),
    ],
    [showBikeCol, bikeName]
  )

  const [sorting, setSorting] = useState<SortingState>([{ id: 'startTime', desc: true }])

  const table = useReactTable({
    data: activities,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {activities.length} of {total} activit{total === 1 ? 'y' : 'ies'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b text-left text-gray-500">
                  {hg.headers.map((header) => {
                    const align = (header.column.columnDef.meta as any)?.align === 'right'
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        className={`px-4 py-3 font-medium whitespace-nowrap ${align ? 'text-right' : ''} ${canSort ? 'cursor-pointer select-none' : ''}`}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort &&
                            (sorted === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-40" />
                            ))}
                        </span>
                      </th>
                    )
                  })}
                  <th className="w-4 px-4 py-3" />
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const a = row.original
                const cached = !!queryClient.getQueryData(['activity-details', a.id])
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b hover:bg-gray-50"
                    onClick={() => onRowClick(a.id)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align = (cell.column.columnDef.meta as any)?.align === 'right'
                      return (
                        <td key={cell.id} className={`px-4 py-2 ${align ? 'text-right' : ''}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                    <td className="w-4 px-4 py-2">
                      {cached && (
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"
                          title="Details loaded"
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ←
          </Button>
          <span className="text-xs text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
