"use client";
import useSWR from "swr";
import { useState } from "react";

type KdsItem = {
  id: string;
  status: string;
  observacoes: string | null;
  prontoEm: string | null;
  createdAt: string;
  product: { nome: string; categoria: string };
  order: { createdAt: string; table: { numero: number } };
};

type ApiResponse = {
  pendentes: KdsItem[];
  concluidos: KdsItem[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Aba = "pendentes" | "concluidos";

function tempoDecorrido(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}m${diff % 60 > 0 ? ` ${diff % 60}s` : ""}`;
}

function horaFormatada(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function urgencyClass(iso: string) {
  const minutos = (Date.now() - new Date(iso).getTime()) / 60000;
  if (minutos >= 15) return "border-red-500 shadow-red-900/40";
  if (minutos >= 8)  return "border-amber-400 shadow-amber-900/30";
  return "border-zinc-700 shadow-black/20";
}

function MesaBadge({ numero, muted = false }: { numero: number; muted?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[52px] ${muted ? "bg-zinc-800/60" : "bg-zinc-800"}`}>
      <span className={`text-2xl font-black leading-none ${muted ? "text-zinc-500" : "text-amber-400"}`}>{numero}</span>
      <span className={`text-[11px] font-bold tracking-widest uppercase ${muted ? "text-zinc-600" : "text-zinc-300"}`}>mesa</span>
    </div>
  );
}

export default function KdsBoard() {
  const { data, mutate } = useSWR<ApiResponse>("/api/cozinha/pedidos", fetcher, {
    refreshInterval: 2000,
  });
  const [aba, setAba] = useState<Aba>("pendentes");
  const [despachando, setDespachando] = useState<Set<string>>(new Set());

  const pendentes  = data?.pendentes  ?? [];
  const concluidos = data?.concluidos ?? [];

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

  return (
    <div className="min-h-screen bg-zinc-950 p-4 pb-8">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🍳 Cozinha</h1>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-500">ao vivo</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setAba("pendentes")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors ${
            aba === "pendentes"
              ? "bg-amber-500 text-zinc-900"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Pendentes
          {pendentes.length > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-black ${aba === "pendentes" ? "bg-zinc-900/30 text-zinc-900" : "bg-zinc-700 text-zinc-300"}`}>
              {pendentes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAba("concluidos")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors ${
            aba === "concluidos"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Concluídos
          {concluidos.length > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-black ${aba === "concluidos" ? "bg-white/20 text-white" : "bg-zinc-700 text-zinc-300"}`}>
              {concluidos.length}
            </span>
          )}
        </button>
      </div>

      {/* Aba Pendentes */}
      {aba === "pendentes" && (
        <>
          {pendentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 py-16">
              <span className="text-5xl">✅</span>
              <p className="text-lg font-semibold text-zinc-400">Fila limpa</p>
              <p className="text-xs text-zinc-600">Nenhum pedido aguardando preparo</p>
            </div>
          ) : (
            <>
              {/* Legenda */}
              <div className="mb-4 flex gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-zinc-700 bg-zinc-800" />Normal</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-950/30" />+8 min</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-red-500 bg-red-950/30" />+15 min</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                          <span className="block text-xs font-semibold text-zinc-400">{tempoDecorrido(item.order.createdAt)}</span>
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
            </>
          )}
        </>
      )}

      {/* Aba Concluídos */}
      {aba === "concluidos" && (
        <>
          {concluidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 py-16">
              <span className="text-5xl">🍽️</span>
              <p className="text-lg font-semibold text-zinc-400">Nenhum item concluído hoje</p>
              <p className="text-xs text-zinc-600">Zera automaticamente à meia-noite</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {concluidos.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
                >
                  <MesaBadge numero={item.order.table.numero} muted />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-400">{item.product.nome}</p>
                    {item.observacoes && (
                      <p className="truncate text-xs text-zinc-600">{item.observacoes}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-emerald-600">
                      {item.prontoEm ? horaFormatada(item.prontoEm) : "—"}
                    </p>
                    <p className="text-xs text-zinc-600">concluído</p>
                  </div>
                  <span className="shrink-0 text-emerald-600 text-lg">✓</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
