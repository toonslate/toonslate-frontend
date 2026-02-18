import { queryOptions, skipToken } from "@tanstack/react-query";

import type { TranslateResponse } from "@/api";
import { getTranslate } from "@/api";

export const translateQueries = {
  all: () => ["translate"] as const,

  details: () => [...translateQueries.all(), "detail"] as const,

  detail: (translateId: string | null) =>
    queryOptions({
      queryKey: [...translateQueries.details(), translateId],
      queryFn: translateId ? () => getTranslate(translateId) : skipToken,
      refetchInterval: ({ state: { data } }) => {
        if (!data) return false;

        const isProcessing = data.status === "pending" || data.status === "processing";
        return isProcessing ? 2000 : false;
      },
    }),
};

export type { TranslateResponse };
