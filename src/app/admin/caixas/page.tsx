"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Caixa = { id: string; nome: string; ativo: boolean };

export default function AdminCaixasPage() {
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    const r = await fetch("/api/caixas");
    const data = await r.json();
    setCaixas(data);
  }

  useEffect(() => { carregar(); }, []);

  async function adicionar() {
    if (!novoNome.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      const r = await fetch("/api/caixas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim() }),
      });
      if (!r.ok) { const d = await r.json(); setErro(d.error ?? "Erro"); return; }
      setNovoNome("");
      await carregar();
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    await fetch(`/api/caixas/${id}`, { method: "DELETE" });
    await carregar();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Caixas</h1>
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">
          ← Voltar
        </Link>
      </div>

      {/* Adicionar */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">Adicionar caixa</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => { setNovoNome(e.target.value); setErro(""); }}
            onKeyDown={(e) => e.key === "Enter" && adicionar()}
            placeholder="Nome do caixa..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            onClick={adicionar}
            disabled={salvando || !novoNome.trim()}
            className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {salvando ? "..." : "Adicionar"}
          </button>
        </div>
        {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {caixas.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhum caixa cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {caixas.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-medium text-slate-800">{c.nome}</span>
                <button
                  onClick={() => remover(c.id)}
                  className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400 text-center">
        {caixas.length} caixa{caixas.length !== 1 ? "s" : ""} cadastrado{caixas.length !== 1 ? "s" : ""}
      </p>
    </main>
  );
}
