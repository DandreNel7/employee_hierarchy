import Papa from "papaparse";

import type { Employee } from "@/types";

function safeCell(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export function exportEmployees(
  employees: Employee[],
  managerEmails: Map<number, string>,
) {
  const rows = employees.map((employee) => ({
    employee_number: employee.employee_number,
    first_name: safeCell(employee.first_name),
    last_name: safeCell(employee.last_name),
    email: employee.email,
    birth_date: employee.birth_date,
    salary: employee.salary,
    role: safeCell(employee.role),
    department: safeCell(employee.department?.name ?? ""),
    manager_email: employee.manager_id
      ? (managerEmails.get(employee.manager_id) ?? "")
      : "",
  }));

  const csv = Papa.unparse(rows);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
