"use client";

import { useQuery } from "@tanstack/react-query";

export interface TSumupStatus {
  configured: boolean;
  merchantCode: string | null;
  readerId: string | null;
  readerName: string | null;
  readerStatus: string | null;
}

export function useGetSumupStatus() {
  return useQuery<TSumupStatus>({
    queryKey: ["sumupStatus"],
    queryFn: async () => {
      const response = await fetch("/api/sumup/credentials");

      if (!response.ok) {
        throw new Error("Não foi possível carregar o status da maquininha.");
      }

      return response.json();
    },
  });
}
