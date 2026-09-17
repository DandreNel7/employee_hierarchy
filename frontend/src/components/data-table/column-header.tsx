import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ColumnKind = "text" | "number" | "date";

const SORT_LABELS: Record<ColumnKind, { asc: string; desc: string }> = {
  text: { asc: "Sort A to Z", desc: "Sort Z to A" },
  number: { asc: "Sort lowest first", desc: "Sort highest first" },
  date: { asc: "Sort oldest first", desc: "Sort newest first" },
};

interface Props<TData> {
  column: Column<TData, unknown>;
  title: string;
  kind?: ColumnKind;
  filterable?: boolean;
}

export default function ColumnHeader<TData>({
  column,
  title,
  kind = "text",
  filterable = false,
}: Props<TData>) {
  const sorted = column.getIsSorted();
  const filtered = column.getFilterValue() !== undefined;
  const labels = SORT_LABELS[kind];

  if (!column.getCanSort() && !filterable) {
    return <span>{title}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "-ml-2 h-8 gap-1",
            (sorted || filtered) && "text-primary",
          )}
        >
          {title}
          {sorted === "asc" && <ArrowUp className="size-3.5" />}
          {sorted === "desc" && <ArrowDown className="size-3.5" />}
          {!sorted && <ChevronsUpDown className="size-3.5 opacity-40" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-52">
        {column.getCanSort() && (
          <>
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUp className="size-4" />
              {labels.asc}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDown className="size-4" />
              {labels.desc}
            </DropdownMenuItem>
            {sorted && (
              <DropdownMenuItem
                onClick={() => column.clearSorting()}
                className="text-muted-foreground focus:text-destructive"
              >
                <X className="size-4" />
                Clear sort
              </DropdownMenuItem>
            )}
          </>
        )}

        {filterable && (
          <>
            {column.getCanSort() && <DropdownMenuSeparator />}
            <div className="p-1" onKeyDown={(event) => event.stopPropagation()}>
              <Input
                placeholder={`Filter ${title.toLowerCase()}...`}
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  column.setFilterValue(event.target.value || undefined)
                }
                className="h-8"
              />
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
