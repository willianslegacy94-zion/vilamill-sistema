"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

type Despesa = {
  id: string;
  descricao: string;
  valor: string;
  categoria: string;
  data: string;
  registradoPor: string;
};

const CATEGORIAS = ["Mercadoria", "Serviços", "Manutenção", "Funcionários", "Aluguel", "Outros"];

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function toInputDate(d: string) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

type Modo = "novo" | "editar" | null;

const formVazio = { descricao: "", valor: "", categoria: "Mercadoria", data: "" };

export default function DespesasTable({ despesas: inicial }: { despesas: Despesa[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const usuario = (session?.user as any)?.name ?? "admin";

  const [modo, setModo] = useState<Modo>(null);
  const [selecionada, setSelecionada] = useState<Despesa | null>(null);
  const [form, setForm] = useState(formVazio);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const despesas = inicial
    .filter((d) => filtroCategoria === "Todas" || d.categoria === filtroCategoria)
    .filter((d) => d.descricao.toLowerCase().includes(busca.toLowerCase()));

  const totalGeral = inicial.reduce((s, d) => s + Number(d.valor), 0);
  const totalFiltrado = despesas.reduce((s, d) => s + Number(d.valor), 0);

  const porCategoria = CATEGORIAS.map((cat) => ({
    cat,
    total: inicial.filter((d) => d.categoria === cat).reduce((s, d) => s + Number(d.valor), 0),
  })).filter((c) => c.total > 0);

  function abrirNovo() {
    const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    setForm({ ...formVazio, data: hoje });
    setSelecionada(null);
    setModo("novo");
  }

  function abrirEditar(d: Despesa) {
    setForm({ descricao: d.descricao, valor: Number(d.valor).toFixed(2), categoria: d.categoria, data: toInputDate(d.data) });
    setSelecionada(d);
    setModo("editar");
  }

  function fechar() { setModo(null); setSelecionada(null); }

  async function chamarAPI(fn: () => Promise<Response>) {
    setCarregando(true);
    try {
      const res = await fn();
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Erro"); }
      router.refresh();
      fechar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function salvar() {
    if (!form.descricao || !form.valor || !form.data) return;
    const dataISO = new Date(`${form.data}T12:00:00-03:00`).toISOString();
    if (modo === "novo") {
      chamarAPI(() => fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, valor: Number(form.valor), data: dataISO, registradoPor: usuario }),
      }));
    } else {
      chamarAPI(() => fetch(`/api/despesas/${selecionada!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, valor: Number(form.valor), data: dataISO }),
      }));
    }
  }

  function excluir(d: Despesa) {
    if (!confirm(`Excluir "${d.descricao}"?`)) return;
    chamarAPI(() => fetch(`/api/despesas/${d.id}`, { method: "DELETE" }));
  }

  return (
    <>
      {/* Resumo por categoria */}
      {porCategoria.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-red-500">Total geral</p>
            <p className="mt-1 text-xl font-bold text-red-700">{moeda(totalGeral)}</p>
          </div>
          {porCategoria.map(({ cat, total }) => (
            <div key={cat} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase text-slate-400">{cat}</p>
              <p className="mt-1 text-lg font-bold text-slate-800">{moeda(total)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + botão novo */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <option value="Todas">Todas as categorias</option>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Button onClick={abrirNovo} className="ml-auto">+ Nova Despesa</Button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-left">Registrado por</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {despesas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nenhuma despesa registrada.</td></tr>
            )}
            {despesas.map((d) => (
              <tr key={d.id} className="bg-white hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{formatData(d.data)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{d.descricao}</td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{d.categoria}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{d.registradoPor}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">{moeda(Number(d.valor))}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => abrirEditar(d)}>Editar</Button>
                    <Button variant="ghost" className="h-8 px-2 text-xs text-red-500 hover:bg-red-50" onClick={() => excluir(d)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {despesas.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-700">
                  {filtroCategoria !== "Todas" ? `Total — ${filtroCategoria}` : "Total do período"}
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-red-700">{moeda(totalFiltrado)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal */}
      {modo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={fechar}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{modo === "novo" ? "Nova Despesa" : "Editar Despesa"}</h2>
              <button onClick={fechar} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Descrição</label>
                <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Ex: Compra de carnes" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Valor (R$)</label>
                  <input type="number" min={0.01} step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="0,00" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Data</label>
                  <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Categoria</label>
                <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={fechar} className="flex-1">Cancelar</Button>
              <Button onClick={salvar} disabled={carregando || !form.descricao || !form.valor || !form.data} className="flex-1">
                {carregando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
