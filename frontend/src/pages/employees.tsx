import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Download, Plus, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";

import DeleteEmployeeDialog from "@/components/delete-employee-dialog";
import EmployeeDialog from "@/components/employee-dialog";
import {
  columnLabels,
  employeeColumns,
  sortDescription,
} from "@/components/employees/columns";
import EmployeesToolbar from "@/components/employees/toolbar";
import ImportDialog from "@/components/import-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportEmployees } from "@/lib/csv";
import { useDepartments } from "@/lib/departments";
import { useEmployees } from "@/lib/employees";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const { data: employees = [], isPending } = useEmployees();
  const { data: departments = [] } = useDepartments();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Employee | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const emailsById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.email])),
    [employees],
  );

  const managerNames = useMemo(() => {
    const names = new Map<number, string>();
    for (const employee of employees) {
      names.set(employee.id, `${employee.first_name} ${employee.last_name}`);
    }
    return names;
  }, [employees]);

  const columns = useMemo(
    () =>
      employeeColumns({
        managerNames,
        onEdit: (employee) => {
          setEditing(employee);
          setDialogOpen(true);
        },
        onDelete: setDeleting,
      }),
    [managerNames],
  );

  const table = useReactTable({
    data: employees,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter: search },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const sortedBy = sorting[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {employees.length}{" "}
            shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Download className="size-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportEmployees(
                table.getFilteredRowModel().rows.map((row) => row.original),
                emailsById,
              )
            }
          >
            <Upload className="size-4" />
            Export
          </Button>
          <Button
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add employee
          </Button>
        </div>
      </div>

      <EmployeesToolbar
        table={table}
        search={search}
        onSearchChange={setSearch}
      />

      {sortedBy && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {sortedBy.desc ? (
            <ArrowDown className="size-4" />
          ) : (
            <ArrowUp className="size-4" />
          )}
          Sorted by {columnLabels[sortedBy.id] ?? sortedBy.id},{" "}
          {sortDescription(sortedBy.id, sortedBy.desc)}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 hover:text-destructive"
            onClick={() => setSorting([])}
          >
            <X className="size-4" />
            <span className="sr-only">Clear sort</span>
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.getIsSorted() ? "bg-muted/60" : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isPending &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isPending && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No employees found.
                </TableCell>
              </TableRow>
            )}

            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.getIsSorted() ? "bg-muted/40" : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editing}
        employees={employees}
        departments={departments}
      />

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <DeleteEmployeeDialog
        key={deleting?.id}
        employee={deleting}
        employees={employees}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
