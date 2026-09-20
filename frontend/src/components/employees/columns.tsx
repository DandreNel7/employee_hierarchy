import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import ColumnHeader, {
  type ColumnKind,
} from "@/components/data-table/column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatSalary, initials } from "@/lib/format";
import type { Employee } from "@/types";

type Range = [string, string];

/** Keeps rows whose value sits between the two boxes, ignoring an empty box. */
function inRange(value: string | number, [from, to]: Range) {
  if (from !== "" && String(value) < from) return false;
  if (to !== "" && String(value) > to) return false;
  return true;
}

export const columnLabels: Record<string, string> = {
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

export function sortDescription(columnId: string, descending: boolean) {
  const kind = columnKinds[columnId] ?? "text";
  if (kind === "number") return descending ? "highest first" : "lowest first";
  if (kind === "date") return descending ? "newest first" : "oldest first";
  return descending ? "Z to A" : "A to Z";
}

interface Options {
  managerNames: Map<number, string>;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export function employeeColumns({
  managerNames,
  onEdit,
  onDelete,
}: Options): ColumnDef<Employee>[] {
  return [
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
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      id: "department",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Department" />
      ),
      accessorFn: (row) => row.department?.name ?? "",
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
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
      header: ({ column }) => <ColumnHeader column={column} title="Manager" />,
      accessorFn: (row) =>
        row.manager_id ? (managerNames.get(row.manager_id) ?? "") : "",
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
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
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
