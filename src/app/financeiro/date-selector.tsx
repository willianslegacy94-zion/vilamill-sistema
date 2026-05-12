"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = { from: string; to: string };

const ATALHOS = [
  { label: "Hoje", dias: 0 },
  { label: "7 dias", dias: 6 },
  { label: "Mês", dias: null },
] as const;

function hojeStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function primeiroDiaMes() {
  const [y, m] = hojeStr().split("-");
  return `${y}-${m}-01`;
}

export default function DateRangeFilter({ from, to }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function navegar(novoFrom: string, novoTo: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("from", novoFrom);
    sp.set("to", novoTo);
    router.push(`/financeiro?${sp.toString()}`);
  }

  function atalho(dias: number | null) {
    const hoje = hojeStr();
    if (dias === null) {
      navegar(primeiroDiaMes(), hoje);
    } else {
      const d = new Date(`${hoje}T12:00:00`);
      d.setDate(d.getDate() - dias);
      navegar(d.toLocaleDateString("en-CA"), hoje);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Atalhos rápidos */}
      <div className="flex overflow-hidden rounded-md border border-slate-300">
        {ATALHOS.map((a, idx) => (
          <button
            key={a.label}
            onClick={() => atalho(a.dias)}
            className={`px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors ${
              idx < ATALHOS.length - 1 ? "border-r border-slate-300" : ""
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Inputs de data */}
      <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5">
        <span className="text-xs font-medium text-slate-500">De</span>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => e.target.value && navegar(e.target.value, to)}
          className="text-sm text-slate-800 focus:outline-none"
        />
      </div>

      <span className="text-slate-400 text-sm">→</span>

      <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5">
        <span className="text-xs font-medium text-slate-500">Até</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => e.target.value && navegar(from, e.target.value)}
          className="text-sm text-slate-800 focus:outline-none"
        />
      </div>
    </div>
  );
}
