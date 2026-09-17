import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { Employee } from "@/types";

export interface EmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  salary: string;
  role: string;
  department_id: number | null;
  manager_id: number | null;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await api.get<Employee[]>("/employees");
      return data;
    },
  });
}

export function useSaveEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: number;
      values: EmployeeInput;
    }) => {
      const { data } = id
        ? await api.put<Employee>(`/employees/${id}`, values)
        : await api.post<Employee>("/employees", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reassignTo,
    }: {
      id: number;
      reassignTo: number | null;
    }) =>
      api.delete(`/employees/${id}`, {
        params: reassignTo === null ? {} : { reassign_to: reassignTo },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// Everyone below this employee.
export function descendantIds(employees: Employee[], employeeId: number) {
  const ids = new Set<number>();
  const queue = [employeeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const employee of employees) {
      if (employee.manager_id === current && !ids.has(employee.id)) {
        ids.add(employee.id);
        queue.push(employee.id);
      }
    }
  }
  return ids;
}
