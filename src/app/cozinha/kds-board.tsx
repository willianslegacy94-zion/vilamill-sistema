"use client";
import useSWR from "swr";
import { useState } from "react";

type KdsItem = {
  id: string;
  status: string;
  observacoes: string | null;
  createdAt: string;
  product: { nome: string; categoria: string };
  order: { createdAt: string; table: { numero: number } };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function tempoDecorrido(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}m${diff % 60 > 0 ? ` ${diff % 60}s` : ""}`;
}

function urgencyClass(iso: string) {
  const minutos = (Date.now() - new Date(iso).getTime()) / 60000;
  if (minutos >= 15) return "border-red-500 shadow-red-900/40";
  if (minutos >= 8)  return "border-amber-400 shadow-amber-900/30";
  return "border-zinc-700 shadow-black/20";
}

function MesaBadge({ numero }: { numero: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-800 px-3 py-2 min-w-[52px]">
      <span className="text-2xl font-black leading-none text-amber-400">{numero}</span>
      <span className="text-[11px] font-bold tracking-widest text-zinc-300 uppercase">mesa</span>
    </div>
  );
}

export default function KdsBoard() {
  const { data: items = [], mutate } = useSWR<KdsItem[]>("/api/cozinha/pedidos", fetcher, {
    refreshInterval: 2000,
  });
  const [despachando, setDespachando] = useState<Set<string>>(new Set());
  const [prontoAberto, setProntoAberto] = useState(false);

  const pendentes = items.filter((i) => i.status === "PENDENTE");
  const prontos   = items.filter((i) => i.status === "PRONTO");

  async function marcarPronto(itemId: string) {
    setDespachando((prev) => new Set(prev).add(itemId));
    try {
      await fetch(`/api/cozinha/pedidos/${itemId}`, { method: "PATCH" });
      mutate();
    } finally {
      setDespachando((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  if (pendentes.length === 0 && prontos.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
        <span className="text-6xl">✅</span>
        <p className="text-2xl font-bold text-zinc-400">Nenhum pedido pendente</p>
        <p className="text-sm text-zinc-600">Atualiza automaticamente a cada 2 segundos</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🍳 Cozinha</h1>
          <p className="text-xs text-zinc-500">
            {pendentes.length} {pendentes.length === 1 ? "pedido pendente" : "pedidos pendentes"} · atualiza a cada 2s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-500">ao vivo</span>
        </div>
      </div>

      {/* Legenda de urgência */}
      <div className="mb-4 flex gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-zinc-700 bg-zinc-800" />Normal</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-950/30" />+8 min</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-red-500 bg-red-950/30" />+15 min</span>
      </div>

      {/* Fila pendente */}
      {pendentes.length === 0 ? (
        <div className="mb-6 flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 py-10">
          <span className="text-4xl">✅</span>
          <p className="text-base font-semibold text-zinc-400">Fila limpa</p>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pendentes.map((item) => {
            const ocupado = despachando.has(item.id);
            return (
              <div
                key={item.id}
                className={`flex flex-col rounded-2xl border-2 bg-zinc-900 p-5 shadow-lg transition-all ${urgencyClass(item.order.createdAt)}`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <MesaBadge numero={item.order.table.numero} />
                  <div className="text-right">
                    <span className="block text-xs font-semibold text-zinc-400">
                      {tempoDecorrido(item.order.createdAt)}
                    </span>
                    <span className="block text-xs text-zinc-600">{item.product.categoria}</span>
                  </div>
                </div>

                <p className="mb-2 flex-1 text-2xl font-black leading-tight text-white">
                  {item.product.nome}
                </p>

                {item.observacoes && (
                  <div className="mb-4 rounded-lg bg-zinc-800 px-3 py-2">
                    <p className="text-sm font-semibold text-amber-400">{item.observacoes}</p>
                  </div>
                )}

                <button
                  onClick={() => marcarPronto(item.id)}
                  disabled={ocupado}
                  className="mt-auto w-full rounded-xl bg-emerald-500 py-4 text-base font-black tracking-widest text-zinc-900 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {ocupado ? "..." : "✓ PRONTO"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Seção Prontos — colapsável */}
      {prontos.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <button
            onClick={() => setProntoAberto((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-zinc-400">Prontos</span>
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs font-bold text-zinc-300">
                {prontos.length}
              </span>
            </div>
            <span className="text-zinc-600 text-lg leading-none">
              {prontoAberto ? "▲" : "▼"}
            </span>
          </button>

          {prontoAberto && (
            <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
              <div className="flex flex-col gap-2">
                {prontos.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 opacity-60"
                  >
                    <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-800 px-2.5 py-1.5 min-w-[44px]">
                      <span className="text-base font-black leading-none text-zinc-400">{item.order.table.numero}</span>
                      <span className="text-[9px] font-bold tracking-widest text-zinc-600 uppercase">mesa</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-400">{item.product.nome}</p>
                      {item.observacoes && (
                        <p className="truncate text-xs text-zinc-600">{item.observacoes}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-600">
                      {tempoDecorrido(item.createdAt)} atrás
                    </span>
                    <span className="shrink-0 text-emerald-600 text-base">✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
