"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react"

export function DataTable({
  data,
  columns,
  pageSize = 15,
  searchPlaceholder = "Buscar...",
  showSearch = true,
  emptyMessage = "Nenhum registro encontrado.",
  emptyIcon = null,
}) {
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const EmptyIcon = emptyIcon

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fyn-muted" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-72 rounded-lg border border-fyn-border bg-fyn-bg py-2 pl-10 pr-4 text-sm text-fyn-text placeholder:text-fyn-text-light transition-all focus:border-fyn-accent focus:outline-none focus:ring-2 focus:ring-fyn-accent/20"
            />
          </div>
          <p className="text-sm text-fyn-text-muted">
            <span className="font-medium text-fyn-text">{table.getFilteredRowModel().rows.length}</span> registros
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-fyn-border bg-fyn-bg shadow-sm">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-fyn-border bg-fyn-surface">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-fyn-text-muted"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? "cursor-pointer select-none hover:text-fyn-text" : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-fyn-text-light">
                            {{
                              asc: <ChevronUp className="h-4 w-4 text-fyn-accent" />,
                              desc: <ChevronDown className="h-4 w-4 text-fyn-accent" />,
                            }[header.column.getIsSorted()] ?? <ChevronsUpDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-fyn-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {EmptyIcon && <EmptyIcon className="h-10 w-10 text-fyn-text-light" />}
                    <p className="text-sm text-fyn-text-muted">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`transition-colors hover:bg-fyn-surface/70 ${idx % 2 === 1 ? "bg-fyn-surface/30" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-fyn-text">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-fyn-text-muted">
            Página <span className="font-medium text-fyn-text">{table.getState().pagination.pageIndex + 1}</span> de{" "}
            <span className="font-medium text-fyn-text">{table.getPageCount()}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex items-center gap-1 rounded-lg border border-fyn-border px-3 py-1.5 text-sm font-medium text-fyn-text transition-colors hover:bg-fyn-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex items-center gap-1 rounded-lg border border-fyn-border px-3 py-1.5 text-sm font-medium text-fyn-text transition-colors hover:bg-fyn-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
