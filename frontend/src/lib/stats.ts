import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { Stats } from "@/types";

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data } = await api.get<Stats>("/stats");
      return data;
    },
  });
}
