"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, TriangleAlert } from "lucide-react";
import { useDashboard } from "@/hooks/useAppData";

export default function NotificationsBell() {
  const { stats } = useDashboard();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const insumoCriticos = (stats as { insumoCriticos?: { id: string; nome: string }[] } | null)?.insumoCriticos ?? [];
  const total = insumoCriticos.length;

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onClickFora);
    return () => document.removeEventListener("mousedown", onClickFora);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative flex items-center justify-center rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
        title="Alertas"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {total}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Alertas</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {total === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhum alerta no momento.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {insumoCriticos.map((i) => (
                  <li key={i.id}>
                    <Link
                      href="/estoque"
                      onClick={() => setAberto(false)}
                      className="flex items-start gap-2.5 px-4 py-3 text-sm hover:bg-red-50 transition-colors"
                    >
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span className="font-medium text-red-700">Estoque crítico: {i.nome}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
