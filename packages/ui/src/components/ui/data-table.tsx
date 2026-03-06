'use client'

import { flexRender, functionalUpdate, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { InboxIcon } from 'lucide-react'
import type {
  ColumnDef,
  VisibilityState,
  PaginationState,
  RowData,
  SortingState,
  Updater,
  PaginationOptions,
  SortingOptions,
  VisibilityOptions,
} from '@tanstack/react-table'
import React, { useState, Fragment } from 'react'
import { DataTablePagination } from '@play-money/ui/data-table-pagination'
import { DataTableViewOptions } from '@play-money/ui/data-table-view-options'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@play-money/ui/table'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useSearchParam } from '../../hooks/useSearchParam'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Extended interfaces need to match the same type signature of the original
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string
  }
}

export type PageInfo = {
  hasNextPage: boolean
  endCursor?: string
  total: number
}

type DataTableProps<TData, TValue> = {
  columns: Array<ColumnDef<TData, TValue>>
  data: Array<TData>
  pageInfo: PageInfo
  controls?: React.ReactNode
  showViewOptions?: boolean
  emptyState?: React.ReactNode
}

function useURLSorting(): SortingOptions<unknown> & { sorting: SortingState } {
  const [sorting, setSorting] = useSearchParam('sort')

  let sortingState: SortingState = []
  if (sorting) {
    const [id, direction] = sorting.split('-')
    sortingState = [
      {
        id,
        desc: direction === 'desc',
      },
    ]
  }

  return {
    sorting: sortingState,
    onSortingChange: (changeFn: Updater<SortingState>) => {
      const results = functionalUpdate(changeFn, sortingState)
      setSorting(results.map(({ id, desc }) => `${id}-${desc ? 'desc' : 'asc'}`).join(','))
    },
    manualSorting: true,
  }
}

function useURLPagination({ total }: { total: number }): PaginationOptions & { pagination: PaginationState } {
  const [pageSize] = useSearchParam('limit')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: -1,
    pageSize: pageSize ? parseInt(pageSize) : 50,
  })

  return { pagination, onPaginationChange: setPagination, manualPagination: true, rowCount: total }
}

function useLocalStorageColumnVisibility(): VisibilityOptions & { columnVisibility: VisibilityState } {
  const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>('data-table-visibility', {
    commentCount: false,
    uniqueTradersCount: false,
    closeDate: false,
  })

  return {
    columnVisibility,
    onColumnVisibilityChange: setColumnVisibility,
  }
}

export function DataTable<TData, TValue>({
  data,
  columns,
  pageInfo,
  // eslint-disable-next-line react/jsx-no-useless-fragment -- empty controls are fine
  controls = <></>,
  showViewOptions = true,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const { sorting, ...sortingOptions } = useURLSorting()
  const { pagination, ...paginationOptions } = useURLPagination({ total: pageInfo.total })
  const { columnVisibility, ...columnVisibilityOptions } = useLocalStorageColumnVisibility()

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, pagination, sorting },
    getCoreRowModel: getCoreRowModel(),
    ...paginationOptions,
    ...sortingOptions,
    ...columnVisibilityOptions,
  })

  return (
    <div className="flex w-full flex-col gap-4">
      {showViewOptions ? (
        <div className="flex justify-between">
          {controls}
          <DataTableViewOptions table={table} />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border text-sm shadow-soft">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className={header.column.columnDef.meta?.headerClassName} key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow data-state={row.getIsSelected() && 'selected'} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-32" colSpan={columns.length}>
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <InboxIcon className="size-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No results</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination pageInfo={pageInfo} table={table} />
    </div>
  )
}
