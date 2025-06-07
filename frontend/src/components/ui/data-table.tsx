import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  error?: boolean;
  emptyMessage?: string;
  // Pagination props
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  rowsPerPage?: string;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: string) => void;
  // Row key function
  getRowKey: (item: T) => string | number;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  error = false,
  emptyMessage = "No data found",
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  rowsPerPage = "10",
  totalItems = 0,
  onPageChange,
  onRowsPerPageChange,
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-red-600">
                Failed to load data
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={getRowKey(item)}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Rows per page:</span>
            <Select value={rowsPerPage} onValueChange={onRowsPerPageChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                &lt;
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                &gt;
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 