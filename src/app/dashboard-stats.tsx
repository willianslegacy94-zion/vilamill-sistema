"use client";

import { TriangleAlert } from "lucide-react";
import { useDashboard } from "@/hooks/useAppData";

type Props = { isAdmin: boolean; isTrainee: boolean };

export default function DashboardStats({ isAdmin, isTrainee }: Props) {
  const { stats, isLoading } = useDashboard();

  const mesasAbertas = stats?.mesasAbertas ?? 0;
  const insumoCriticos: { id: string; nome: string }[] = stats?.insumoCriticos ?? [];
  const vendasHoje = stats?.vendasHoje ?? { total: 0, count: 0 };

  const faturamento = Number(vendasHoje.total).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <>
      {/* Indicadores rápidos */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mesas abertas</p>
          <p className={`mt-1 text-3xl font-bold transition-all ${isLoading ? "text-slate-300 animate-pulse" : mesasAbertas > 0 ? "text-amber-600" : "text-slate-800"}`}>
            {isLoading ? "—" : mesasAbertas}
          </p>
        </div>

        {(isAdmin || isTrainee) && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Faturamento hoje</p>
            <p className={`mt-1 text-2xl font-bold transition-all ${isLoading ? "text-slate-300 animate-pulse" : "text-green-600"}`}>
              {isLoading ? "—" : faturamento}
            </p>
          </div>
        )}

        <div className={`rounded-xl border border-slate-200 bg-white px-5 py-4 ${!isAdmin && !isTrainee ? "col-span-1" : "col-span-2 md:col-span-1"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pedidos fechados</p>
          <p className={`mt-1 text-3xl font-bold transition-all ${isLoading ? "text-slate-300 animate-pulse" : "text-slate-800"}`}>
            {isLoading ? "—" : vendasHoje.count}
          </p>
        </div>
      </div>

      {/* Alertas de estoque crítico */}
      {insumoCriticos.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          {insumoCriticos.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-5 py-3">
              <TriangleAlert className="h-5 w-5 shrink-0 text-red-600" />
              <p className="font-semibold text-red-700">ESTOQUE CRÍTICO: {i.nome}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
