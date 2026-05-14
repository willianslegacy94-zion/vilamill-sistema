"use client";

import { TriangleAlert } from "lucide-react";
import { useDashboard } from "@/hooks/useAppData";

type Props = { isAdmin: boolean; isTrainee: boolean };

function StatSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 animate-pulse">
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="mb-3 h-2.5 w-24 rounded bg-slate-200" />
        <div className="h-9 w-12 rounded bg-slate-200" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="mb-3 h-2.5 w-28 rounded bg-slate-200" />
        <div className="h-8 w-24 rounded bg-slate-200" />
      </div>
      <div className="col-span-2 rounded-xl border border-slate-200 bg-white px-5 py-4 md:col-span-1">
        <div className="mb-3 h-2.5 w-28 rounded bg-slate-200" />
        <div className="h-9 w-10 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function DashboardStats({ isAdmin, isTrainee }: Props) {
  const { stats } = useDashboard();

  // Show skeleton only on initial load (stats null).
  // During 3-second revalidations stats keeps its previous value — no flicker.
  if (!stats) return <StatSkeleton />;

  const { mesasAbertas, insumoCriticos, vendasHoje } = stats as {
    mesasAbertas: number;
    insumoCriticos: { id: string; nome: string }[];
    vendasHoje: { total: number; count: number };
  };

  const faturamento = Number(vendasHoje.total).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Mesas abertas
          </p>
          <p className={`mt-1 tabular-nums text-3xl font-bold transition-colors duration-500 ${mesasAbertas > 0 ? "text-amber-600" : "text-slate-800"}`}>
            {mesasAbertas}
          </p>
        </div>

        {(isAdmin || isTrainee) && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Faturamento hoje
            </p>
            <p className="mt-1 tabular-nums text-2xl font-bold text-green-600">
              {faturamento}
            </p>
          </div>
        )}

        <div className={`rounded-xl border border-slate-200 bg-white px-5 py-4 ${!isAdmin && !isTrainee ? "col-span-1" : "col-span-2 md:col-span-1"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pedidos fechados
          </p>
          <p className="mt-1 tabular-nums text-3xl font-bold text-slate-800">
            {vendasHoje.count}
          </p>
        </div>
      </div>

      {insumoCriticos.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          {insumoCriticos.map((i) => (
            <div
              key={i.id}
              className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-5 py-3"
            >
              <TriangleAlert className="h-5 w-5 shrink-0 text-red-600" />
              <p className="font-semibold text-red-700">ESTOQUE CRÍTICO: {i.nome}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
