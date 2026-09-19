import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types";

export interface EmployeeNodeData extends Record<string, unknown> {
  employee: Employee;
  reportCount: number;
  collapsed: boolean;
  highlighted: boolean;
  onToggle: (employeeId: number) => void;
}

export type EmployeeNodeType = Node<EmployeeNodeData, "employee">;

export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 140;

export default function EmployeeNode({ data }: NodeProps<EmployeeNodeType>) {
  const { employee, reportCount, collapsed, highlighted, onToggle } = data;
  const teamLabel = `${reportCount} ${reportCount === 1 ? "report" : "reports"}`;

  return (
    <div
      style={{ width: NODE_WIDTH }}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        highlighted && "border-destructive ring-2 ring-destructive",
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={employee.avatar_url} alt="" />
          <AvatarFallback>
            {initials(employee.first_name, employee.last_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {employee.first_name} {employee.last_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {employee.role}
          </p>
        </div>
      </div>

      <div className="mt-2">
        {employee.department ? (
          <Badge
            variant="outline"
            className="max-w-full truncate text-xs"
            style={{
              borderColor: employee.department.color,
              color: employee.department.color,
            }}
          >
            {employee.department.name}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">No department</span>
        )}
      </div>

      {reportCount > 0 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(employee.id);
          }}
          className={cn(
            "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium",
            collapsed
              ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {collapsed ? (
            <>
              <Users className="size-3.5" />
              Show {teamLabel}
              <ChevronDown className="size-3.5" />
            </>
          ) : (
            <>
              Hide {teamLabel}
              <ChevronUp className="size-3.5" />
            </>
          )}
        </button>
      )}

      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}
