"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DateSelector({ dataAtual }: { dataAtual: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const p = new URLSearchParams(params.toString());
    p.set("data", e.target.value);
    router.push(`/financeiro?${p.toString()}`);
  }

  return (
    <input
      type="date"
      value={dataAtual}
      onChange={onChange}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
    />
  );
}
