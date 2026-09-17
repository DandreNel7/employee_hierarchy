import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { Department } from "@/types"

export interface DepartmentInput {
  name: string
  color: string
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await api.get<Department[]>("/departments")
      return data
    },
  })
}

export function useSaveDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id?: number; values: DepartmentInput }) => {
      const { data } = id
        ? await api.put<Department>(`/departments/${id}`, values)
        : await api.post<Department>("/departments", values)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
  })
}
