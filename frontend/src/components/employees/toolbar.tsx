import type { Table } from "@tanstack/react-table";
import { Settings2, X } from "lucide-react";

import FacetedFilter from "@/components/data-table/faceted-filter";
import RangeFilter from "@/components/data-table/range-filter";
import { columnLabels } from "@/components/employees/columns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/types";

interface Props {
  table: Table<Employee>;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function EmployeesToolbar({
  table,
  search,
  onSearchChange,
}: Props) {
  const isFiltered = table.getState().columnFilters.length > 0 || search !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search everyone..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
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
            onSearchChange("");
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
                onCheckedChange={(checked) => column.toggleVisibility(checked)}
              >
                {columnLabels[column.id] ?? column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
