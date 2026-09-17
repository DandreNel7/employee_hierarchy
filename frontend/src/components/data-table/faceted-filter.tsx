import type { Column } from "@tanstack/react-table";
import { Check, ListFilter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props<TData> {
  column?: Column<TData, unknown>;
  title: string;
}

export default function FacetedFilter<TData>({ column, title }: Props<TData>) {
  const selected = new Set((column?.getFilterValue() as string[]) ?? []);
  const options = Array.from(column?.getFacetedUniqueValues() ?? [])
    .filter(([value]) => value)
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  function toggle(value: string) {
    if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }
    column?.setFilterValue(
      selected.size > 0 ? Array.from(selected) : undefined,
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <ListFilter className="size-4" />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {selected.size} selected
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup>
              {options.map(([value, count]) => (
                <CommandItem
                  key={String(value)}
                  onSelect={() => toggle(String(value))}
                >
                  <div
                    className={cn(
                      "flex size-4 items-center justify-center rounded-sm border",
                      selected.has(String(value))
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50",
                    )}
                  >
                    {selected.has(String(value)) && (
                      <Check className="size-3" />
                    )}
                  </div>
                  <span className="truncate">{String(value)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {count}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center data-[selected=true]:text-destructive"
                  >
                    <X className="size-4" />
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
