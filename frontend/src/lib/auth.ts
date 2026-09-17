import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { User } from "@/types";

export function useUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const { data } = await api.get<User>("/auth/me");
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post<User>("/auth/login", credentials);
      return data;
    },
    onSuccess: (user) => queryClient.setQueryData(["me"], user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => queryClient.clear(),
  });
}
