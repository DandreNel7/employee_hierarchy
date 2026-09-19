import type { Column } from "@tanstack/react-table";
import { ListFilter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

type Range = [string, string];

interface Props<TData> {
  column?: Column<TData, unknown>;
  title: string;
  type: "number" | "date";
}

export default function RangeFilter<TData>({
  column,
  title,
  type,
}: Props<TData>) {
  const [from, to] = (column?.getFilterValue() as Range) ?? ["", ""];
  const isOn = from !== "" || to !== "";

  function update(next: Range) {
    column?.setFilterValue(next[0] === "" && next[1] === "" ? undefined : next);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <ListFilter className="size-4" />
          {title}
          {isOn && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {from || "any"} to {to || "any"}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="space-y-2">
          <Label htmlFor={`${title}-from`}>From</Label>
          <Input
            id={`${title}-from`}
            type={type}
            min={type === "date" ? "1900-01-01" : undefined}
            max={type === "date" ? "2100-12-31" : undefined}
            value={from}
            onChange={(event) => update([event.target.value, to])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${title}-to`}>To</Label>
          <Input
            id={`${title}-to`}
            type={type}
            min={type === "date" ? "1900-01-01" : undefined}
            max={type === "date" ? "2100-12-31" : undefined}
            value={to}
            onChange={(event) => update([from, event.target.value])}
          />
        </div>

        {isOn && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={() => column?.setFilterValue(undefined)}
          >
            <X className="size-4" />
            Clear filter
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
