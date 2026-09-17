import {
  type ColumnDef,
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
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import ColumnHeader, {
  type ColumnKind,
} from "@/components/data-table/column-header";
import FacetedFilter from "@/components/data-table/faceted-filter";
import RangeFilter from "@/components/data-table/range-filter";
import DeleteEmployeeDialog from "@/components/delete-employee-dialog";
import EmployeeDialog from "@/components/employee-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDepartments } from "@/lib/departments";
import { useEmployees } from "@/lib/employees";
import { formatDate, formatSalary, initials } from "@/lib/format";
import type { Employee } from "@/types";

type Range = [string, string];

/** Keeps rows whose value sits between the two boxes, ignoring an empty box. */
function inRange(value: string | number, [from, to]: Range) {
  if (from !== "" && String(value) < from) return false;
  if (to !== "" && String(value) > to) return false;
  return true;
}

const columnLabels: Record<string, string> = {
  name: "Employee",
  employee_number: "Number",
  role: "Role",
  department: "Department",
  manager: "Manager",
  salary: "Salary",
  birth_date: "Birth date",
};

const columnKinds: Record<string, ColumnKind> = {
  salary: "number",
  birth_date: "date",
};

function sortDescription(columnId: string, descending: boolean) {
  const kind = columnKinds[columnId] ?? "text";
  if (kind === "number") return descending ? "highest first" : "lowest first";
  if (kind === "date") return descending ? "newest first" : "oldest first";
  return descending ? "Z to A" : "A to Z";
}

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

  const managerNames = useMemo(() => {
    const names = new Map<number, string>();
    for (const employee of employees) {
      names.set(employee.id, `${employee.first_name} ${employee.last_name}`);
    }
    return names;
  }, [employees]);

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        id: "name",
        header: ({ column }) => (
          <ColumnHeader column={column} title="Employee" filterable />
        ),
        accessorFn: (row) => `${row.first_name} ${row.last_name} ${row.email}`,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={row.original.avatar_url} alt="" />
              <AvatarFallback>
                {initials(row.original.first_name, row.original.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {row.original.first_name} {row.original.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "employee_number",
        header: ({ column }) => (
          <ColumnHeader column={column} title="Number" filterable />
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => <ColumnHeader column={column} title="Role" />,
        filterFn: (row, id, value: string[]) =>
          value.includes(row.getValue(id)),
      },
      {
        id: "department",
        header: ({ column }) => (
          <ColumnHeader column={column} title="Department" />
        ),
        accessorFn: (row) => row.department?.name ?? "",
        filterFn: (row, id, value: string[]) =>
          value.includes(row.getValue(id)),
        cell: ({ row }) =>
          row.original.department ? (
            <Badge
              variant="outline"
              style={{
                borderColor: row.original.department.color,
                color: row.original.department.color,
              }}
            >
              {row.original.department.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: "manager",
        header: ({ column }) => (
          <ColumnHeader column={column} title="Manager" />
        ),
        accessorFn: (row) =>
          row.manager_id ? (managerNames.get(row.manager_id) ?? "") : "",
        filterFn: (row, id, value: string[]) =>
          value.includes(row.getValue(id)),
        cell: ({ getValue }) =>
          (getValue() as string) || (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: "salary",
        header: ({ column }) => (
          <ColumnHeader column={column} title="Salary" kind="number" />
        ),
        accessorFn: (row) => Number(row.salary),
        filterFn: (row, id, [from, to]: Range) => {
          const salary = row.getValue<number>(id);
          if (from !== "" && salary < Number(from)) return false;
          if (to !== "" && salary > Number(to)) return false;
          return true;
        },
        cell: ({ row }) => formatSalary(row.original.salary),
      },
      {
        accessorKey: "birth_date",
        header: ({ column }) => (
          <ColumnHeader column={column} title="Birth date" kind="date" />
        ),
        filterFn: (row, id, value: Range) =>
          inRange(row.getValue<string>(id), value),
        cell: ({ row }) => formatDate(row.original.birth_date),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditing(row.original);
                  setDialogOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleting(row.original)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
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

  const isFiltered = columnFilters.length > 0 || search !== "";
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

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search everyone..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-8 w-56"
        />
        <FacetedFilter
          column={table.getColumn("department")}
          title="Department"
        />
        <FacetedFilter column={table.getColumn("role")} title="Role" />
        <FacetedFilter column={table.getColumn("manager")} title="Manager" />
        <RangeFilter
          column={table.getColumn("salary")}
          title="Salary"
          type="number"
        />
        <RangeFilter
          column={table.getColumn("birth_date")}
          title="Birth date"
          type="date"
        />

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => {
              table.resetColumnFilters();
              setSearch("");
            }}
          >
            <X className="size-4" />
            Reset filters
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Settings2 className="size-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  onSelect={(event) => event.preventDefault()}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) =>
                    column.toggleVisibility(checked)
                  }
                >
                  {columnLabels[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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

      <DeleteEmployeeDialog
        key={deleting?.id}
        employee={deleting}
        employees={employees}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
