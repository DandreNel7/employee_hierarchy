import { Building2, Crown, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSalary } from "@/lib/format";
import { useStats } from "@/lib/stats";

const ROLES_SHOWN = 10;

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" />
          {title}
        </CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isPending } = useStats();

  if (isPending || !stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const byDepartment = stats.headcount_by_department.map((row) => ({
    name: row.name,
    employees: row.employee_count,
    fill: row.color,
  }));

  const byRole = stats.salary_by_role.slice(0, ROLES_SHOWN).map((row) => ({
    role: row.role,
    salary: Number(row.average_salary),
    employees: row.employee_count,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An overview of the organisation
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Employees"
          value={String(stats.employee_count)}
          hint="People on the system"
          icon={Users}
        />
        <StatCard
          title="Departments"
          value={String(stats.department_count)}
          hint="Used to group employees"
          icon={Building2}
        />
        <StatCard
          title="Average salary"
          value={
            stats.average_salary ? formatSalary(stats.average_salary) : "-"
          }
          hint="Across everyone on the system"
          icon={TrendingUp}
        />
        <StatCard
          title="Top of hierarchy"
          value={String(stats.without_manager)}
          hint={
            stats.without_manager === 1
              ? "Employee with no manager"
              : "Employees with no manager"
          }
          icon={Crown}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Employees per department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ employees: { label: "Employees" } }}
              className="h-72 w-full"
            >
              <BarChart data={byDepartment} layout="vertical">
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="employees" radius={4}>
                  {byDepartment.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average salary by role</CardTitle>
            <CardDescription>
              The {Math.min(ROLES_SHOWN, byRole.length)} best paid roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                salary: { label: "Average salary", color: "var(--chart-1)" },
              }}
              className="h-72 w-full"
            >
              <BarChart data={byRole} layout="vertical">
                <YAxis
                  dataKey="role"
                  type="category"
                  width={140}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <XAxis type="number" hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatSalary(String(value))}
                    />
                  }
                />
                <Bar dataKey="salary" fill="var(--color-salary)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
