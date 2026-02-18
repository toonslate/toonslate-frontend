import { queryOptions, skipToken } from "@tanstack/react-query";

import { getBatch } from "@/api";

export const batchQueries = {
  all: () => ["batch"] as const,

  details: () => [...batchQueries.all(), "detail"] as const,

  detail: (batchId: string | null) =>
    queryOptions({
      queryKey: [...batchQueries.details(), batchId],
      queryFn: batchId ? () => getBatch(batchId) : skipToken,
      refetchInterval: ({ state: { data } }) => {
        if (!data) return false;
        return data.status === "processing" ? 2000 : false;
      },
    }),
};
