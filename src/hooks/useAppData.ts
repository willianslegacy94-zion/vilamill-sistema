"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Erro ao buscar dados");
    return r.json();
  });

const SWR_CONFIG = {
  refreshInterval: 3000,
  revalidateOnFocus: true,
};

export function useMesas() {
  const { data, error, isLoading, mutate } = useSWR("/api/mesas", fetcher, SWR_CONFIG);
  return { mesas: data ?? [], isLoading, error, mutate };
}

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher, SWR_CONFIG);
  return { stats: data ?? null, isLoading, error, mutate };
}

export function useFinanceiro(from: string, to: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/financeiro?from=${from}&to=${to}`,
    fetcher,
    SWR_CONFIG
  );
  return { data: data ?? null, isLoading, error, mutate };
}
