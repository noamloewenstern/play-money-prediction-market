import React from 'react'
import { Skeleton } from '@play-money/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@play-money/ui/table'

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="min-w-56">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
      </TableCell>
      <TableCell className="w-64">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell className="w-32">
        <Skeleton className="h-4 w-14" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12" />
      </TableCell>
      <TableCell className="w-14">
        <Skeleton className="h-6 w-6 rounded-full" />
      </TableCell>
    </TableRow>
  )
}

export function MarketsTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="overflow-hidden rounded-xl border text-sm shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Question</TableHead>
              <TableHead className="w-64">Probability</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead>Traders</TableHead>
              <TableHead className="w-32">Liquidity</TableHead>
              <TableHead>Closes</TableHead>
              <TableHead className="w-14">User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
