import type { Employee } from "@/types";

export function reportsByManager(employees: Employee[]) {
  const reports = new Map<number | null, Employee[]>();
  for (const employee of employees) {
    const list = reports.get(employee.manager_id) ?? [];
    list.push(employee);
    reports.set(employee.manager_id, list);
  }
  return reports;
}

export function visibleEmployees(
  employees: Employee[],
  collapsed: Set<number>,
) {
  const reports = reportsByManager(employees);
  const visible: Employee[] = [];

  function walk(managerId: number | null) {
    for (const employee of reports.get(managerId) ?? []) {
      visible.push(employee);
      if (!collapsed.has(employee.id)) walk(employee.id);
    }
  }

  walk(null);
  return visible;
}

export function chainOfCommand(employees: Employee[], employee: Employee) {
  const byId = new Map(employees.map((person) => [person.id, person]));
  const chain: Employee[] = [employee];

  let current = employee;
  while (current.manager_id) {
    const manager = byId.get(current.manager_id);
    if (!manager || chain.includes(manager)) break;
    chain.unshift(manager);
    current = manager;
  }
  return chain;
}

export function matchesSearch(employee: Employee, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return false;
  return [
    `${employee.first_name} ${employee.last_name}`,
    employee.email,
    employee.role,
    employee.employee_number,
    employee.department?.name ?? "",
  ].some((field) => field.toLowerCase().includes(term));
}
