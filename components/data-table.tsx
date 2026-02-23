"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InvoiceItem } from "@/lib/invoice-parser"
import { cn } from "@/lib/utils"

interface DataTableProps {
  items: InvoiceItem[]
  type: "missing" | "extras" | "matching"
  pageSize?: number
}

export function DataTable({ items, type, pageSize = 25 }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items
    const query = searchQuery.toLowerCase()
    return items.filter(
      (item) => item.orderId.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
    )
  }, [items, searchQuery])

  const totalPages = Math.ceil(filteredItems.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize)

  const rowColor =
    type === "missing"
      ? "bg-destructive/5 hover:bg-destructive/10"
      : type === "extras"
        ? "bg-chart-4/5 hover:bg-chart-4/10"
        : "hover:bg-muted/50"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredItems.length} record{filteredItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-foreground font-semibold">Order ID</TableHead>
              <TableHead className="text-foreground font-semibold">Description</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Qty</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Unit Price</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((item, i) => (
              <TableRow key={`${item.orderId}-${i}`} className={cn(rowColor)}>
                <TableCell className="font-medium text-foreground">{item.orderId}</TableCell>
                <TableCell className="text-muted-foreground max-w-[300px] truncate">{item.description}</TableCell>
                <TableCell className="text-right text-foreground">{item.quantity}</TableCell>
                <TableCell className="text-right text-foreground">${item.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium text-foreground">${item.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {paginatedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredItems.length)} of {filteredItems.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
