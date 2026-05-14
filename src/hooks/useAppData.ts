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
  // keeps previous data visible while new data loads — prevents blank flashes
  // when the key changes (e.g. date filter in financeiro) or on remount
  keepPreviousData: true,
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
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/financeiro?from=${from}&to=${to}`,
    fetcher,
    SWR_CONFIG
  );
  return { data: data ?? null, isLoading, isValidating, error, mutate };
}
