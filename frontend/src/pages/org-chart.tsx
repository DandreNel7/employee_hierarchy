import dagre from "@dagrejs/dagre";
import {
  Background,
  Controls,
  type Edge,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronsDownUp, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import DeleteEmployeeDialog from "@/components/delete-employee-dialog";
import EmployeeDialog from "@/components/employee-dialog";
import EmployeeNode, {
  type EmployeeNodeType,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "@/components/org-chart/employee-node";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useDepartments } from "@/lib/departments";
import { useEmployees } from "@/lib/employees";
import { formatDate, formatSalary, initials } from "@/lib/format";
import {
  chainOfCommand,
  matchesSearch,
  reportsByManager,
  visibleEmployees,
} from "@/lib/tree";
import type { Employee } from "@/types";

const nodeTypes = { employee: EmployeeNode };

function layout(nodes: EmployeeNodeType[], edges: Edge[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "TB", nodesep: 24, ranksep: 60 });

  for (const node of nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }
  dagre.layout(graph);

  return nodes.map((node) => {
    const placed = graph.node(node.id);
    return {
      ...node,
      position: {
        x: placed.x - NODE_WIDTH / 2,
        y: placed.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function Chart() {
  const { data: employees = [], isPending } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { fitView } = useReactFlow();

  const [collapsed, setCollapsed] = useState<Set<number> | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const withReports = useMemo(() => {
    const reports = reportsByManager(employees);
    return new Set(
      employees
        .filter((employee) => (reports.get(employee.id)?.length ?? 0) > 0)
        .map((employee) => employee.id),
    );
  }, [employees]);

  const defaultCollapsed = useMemo(
    () =>
      new Set(
        employees
          .filter(
            (employee) =>
              employee.manager_id !== null && withReports.has(employee.id),
          )
          .map((employee) => employee.id),
      ),
    [employees, withReports],
  );

  const toggle = useCallback(
    (employeeId: number) => {
      setCollapsed((current) => {
        const next = new Set(current ?? defaultCollapsed);
        if (next.has(employeeId)) {
          next.delete(employeeId);
        } else {
          next.add(employeeId);
        }
        return next;
      });
    },
    [defaultCollapsed],
  );

  const matches = useMemo(
    () => employees.filter((employee) => matchesSearch(employee, search)),
    [employees, search],
  );

  const effectiveCollapsed = useMemo(
    () => (search.trim() ? new Set<number>() : (collapsed ?? defaultCollapsed)),
    [search, collapsed, defaultCollapsed],
  );

  const { nodes, edges } = useMemo(() => {
    const reports = reportsByManager(employees);
    const visible = visibleEmployees(employees, effectiveCollapsed);
    const matchIds = new Set(matches.map((employee) => employee.id));

    const chartNodes: EmployeeNodeType[] = visible.map((employee) => ({
      id: String(employee.id),
      type: "employee",
      position: { x: 0, y: 0 },
      data: {
        employee,
        reportCount: reports.get(employee.id)?.length ?? 0,
        collapsed: effectiveCollapsed.has(employee.id),
        highlighted: matchIds.has(employee.id),
        onToggle: toggle,
      },
    }));

    const visibleIds = new Set(visible.map((employee) => employee.id));
    const chartEdges: Edge[] = visible
      .filter(
        (employee) =>
          employee.manager_id !== null && visibleIds.has(employee.manager_id),
      )
      .map((employee) => ({
        id: `${employee.manager_id}-${employee.id}`,
        source: String(employee.manager_id),
        target: String(employee.id),
        type: "smoothstep",
      }));

    return { nodes: layout(chartNodes, chartEdges), edges: chartEdges };
  }, [employees, effectiveCollapsed, matches, toggle]);

  const recentre = useCallback(() => {
    setTimeout(() => fitView({ duration: 500, padding: 0.2, maxZoom: 1 }), 50);
  }, [fitView]);

  useEffect(() => {
    const searching = search.trim() !== "";
    if (searching && matches.length === 0) return;

    const timer = setTimeout(
      () =>
        fitView(
          searching
            ? {
                nodes: [{ id: String(matches[0].id) }],
                duration: 500,
                maxZoom: 1.1,
              }
            : { duration: 500, padding: 0.2, maxZoom: 1 },
        ),
      50,
    );
    return () => clearTimeout(timer);
  }, [search, matches, fitView]);

  const managerName = selected?.manager_id
    ? employees.find((employee) => employee.id === selected.manager_id)
    : undefined;
  const chain = selected ? chainOfCommand(employees, selected) : [];
  const directReports = selected
    ? employees.filter((employee) => employee.manager_id === selected.id)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Org chart</h1>
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? `${matches.length} ${matches.length === 1 ? "match" : "matches"}`
              : "Click a card for details, or use the button on a card to show their team"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search the hierarchy..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 w-56"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCollapsed(new Set());
              recentre();
            }}
          >
            <ChevronsUpDown className="size-4" />
            Expand all
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCollapsed(new Set(withReports));
              recentre();
            }}
          >
            <ChevronsDownUp className="size-4" />
            Collapse all
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-14rem)] rounded-md border bg-muted/30">
        {isPending ? (
          <Skeleton className="size-full" />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelected(node.data.employee)}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={0.05}
            nodesDraggable={false}
            proOptions={{ hideAttribution: false }}
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>

      <Sheet open={selected !== null} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={selected.avatar_url} alt="" />
                    <AvatarFallback>
                      {initials(selected.first_name, selected.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>
                      {selected.first_name} {selected.last_name}
                    </SheetTitle>
                    <SheetDescription>{selected.role}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4 px-4 text-sm">
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-muted-foreground">Employee number</dt>
                    <dd>{selected.employee_number}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Department</dt>
                    <dd>
                      {selected.department ? (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: selected.department.color,
                            color: selected.department.color,
                          }}
                        >
                          {selected.department.name}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="truncate">{selected.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Birth date</dt>
                    <dd>{formatDate(selected.birth_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Salary</dt>
                    <dd>{formatSalary(selected.salary)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Manager</dt>
                    <dd>
                      {managerName
                        ? `${managerName.first_name} ${managerName.last_name}`
                        : "None"}
                    </dd>
                  </div>
                </dl>

                <Separator />

                <div>
                  <p className="mb-1 text-muted-foreground">Reporting line</p>
                  <p>
                    {chain
                      .map(
                        (person) => `${person.first_name} ${person.last_name}`,
                      )
                      .join(" > ")}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-muted-foreground">
                    Direct reports ({directReports.length})
                  </p>
                  <ul className="space-y-1">
                    {directReports.map((report) => (
                      <li key={report.id}>
                        {report.first_name} {report.last_name} - {report.role}
                      </li>
                    ))}
                    {directReports.length === 0 && <li>None</li>}
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditing(selected);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleting(selected)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
        onClose={() => {
          setDeleting(null);
          setSelected(null);
        }}
      />
    </div>
  );
}

export default function OrgChartPage() {
  return (
    <ReactFlowProvider>
      <Chart />
    </ReactFlowProvider>
  );
}
