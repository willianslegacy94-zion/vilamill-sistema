"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Unidade = "KG" | "UN" | "L";

type Insumo = {
  id: string;
  nome: string;
  unidade: Unidade;
  quantidadeAtual: string;
  nivelMinimoAlerta: string;
};

type Modo = "novo" | "editar" | "entrada" | "saida" | null;

const UNIDADE_LABEL: Record<Unidade, string> = { KG: "kg", UN: "un", L: "L" };

function emAlerta(insumo: Insumo) {
  return Number(insumo.quantidadeAtual) <= Number(insumo.nivelMinimoAlerta);
}

function formatQtd(valor: string, unidade: Unidade) {
  const n = Number(valor);
  return unidade === "UN" ? String(Math.floor(n)) : n.toFixed(3).replace(".", ",");
}

export default function EstoqueTable({ insumos }: { insumos: Insumo[] }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(null);
  const [selecionado, setSelecionado] = useState<Insumo | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [form, setForm] = useState({ nome: "", unidade: "KG" as Unidade, quantidadeAtual: "", nivelMinimoAlerta: "" });
  const [quantidade, setQuantidade] = useState("");

  const alertas = insumos.filter(emAlerta);

  function abrirNovo() {
    setForm({ nome: "", unidade: "KG", quantidadeAtual: "", nivelMinimoAlerta: "" });
    setModo("novo");
  }

  function abrirEditar(insumo: Insumo) {
    setSelecionado(insumo);
    setForm({
      nome: insumo.nome,
      unidade: insumo.unidade,
      quantidadeAtual: Number(insumo.quantidadeAtual).toString(),
      nivelMinimoAlerta: Number(insumo.nivelMinimoAlerta).toString(),
    });
    setModo("editar");
  }

  function abrirMovimentacao(insumo: Insumo, tipo: "entrada" | "saida") {
    setSelecionado(insumo);
    setQuantidade("");
    setModo(tipo);
  }

  function fecharModal() {
    setModo(null);
    setSelecionado(null);
  }

  async function chamarAPI(fn: () => Promise<Response>) {
    setCarregando(true);
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro desconhecido");
      }
      router.refresh();
      fecharModal();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Ocorreu um erro. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function salvarInsumo() {
    const url = modo === "novo" ? "/api/insumos" : `/api/insumos/${selecionado!.id}`;
    const method = modo === "novo" ? "POST" : "PATCH";
    chamarAPI(() =>
      fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          unidade: form.unidade,
          quantidadeAtual: Number(form.quantidadeAtual),
          nivelMinimoAlerta: Number(form.nivelMinimoAlerta),
        }),
      })
    );
  }

  function registrarMovimentacao() {
    if (!selecionado || !quantidade) return;
    const delta = modo === "entrada" ? Number(quantidade) : -Number(quantidade);
    chamarAPI(() =>
      fetch(`/api/insumos/${selecionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      })
    );
  }

  function excluir(insumo: Insumo) {
    if (!confirm(`Excluir "${insumo.nome}"?`)) return;
    chamarAPI(() => fetch(`/api/insumos/${insumo.id}`, { method: "DELETE" }));
  }

  return (
    <>
      {alertas.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">⚠ {alertas.length} {alertas.length === 1 ? "insumo abaixo" : "insumos abaixo"} do nível mínimo:</span>
          <span>{alertas.map((i) => i.nome).join(", ")}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={abrirNovo}>+ Novo Insumo</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-center">Unidade</th>
              <th className="px-4 py-3 text-right">Qtd Atual</th>
              <th className="px-4 py-3 text-right">Nível Mínimo</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {insumos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhum insumo cadastrado.
                </td>
              </tr>
            )}
            {insumos.map((insumo) => {
              const alerta = emAlerta(insumo);
              return (
                <tr key={insumo.id} className={alerta ? "bg-red-50" : "bg-white"}>
                  <td className="px-4 py-3 font-medium text-slate-900">{insumo.nome}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{UNIDADE_LABEL[insumo.unidade]}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${alerta ? "text-red-700" : "text-slate-800"}`}>
                    {formatQtd(insumo.quantidadeAtual, insumo.unidade)} {UNIDADE_LABEL[insumo.unidade]}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {formatQtd(insumo.nivelMinimoAlerta, insumo.unidade)} {UNIDADE_LABEL[insumo.unidade]}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${alerta ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {alerta ? "Alerta" : "OK"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-8 px-2 text-xs text-green-700 hover:bg-green-50" onClick={() => abrirMovimentacao(insumo, "entrada")}>
                        Entrada
                      </Button>
                      <Button variant="ghost" className="h-8 px-2 text-xs text-amber-700 hover:bg-amber-50" onClick={() => abrirMovimentacao(insumo, "saida")}>
                        Saída
                      </Button>
                      <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => abrirEditar(insumo)}>
                        Editar
                      </Button>
                      <Button variant="ghost" className="h-8 px-2 text-xs text-red-500 hover:bg-red-50" onClick={() => excluir(insumo)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(modo === "novo" || modo === "editar") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={fecharModal}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{modo === "novo" ? "Novo Insumo" : "Editar Insumo"}</h2>
              <button onClick={fecharModal} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Ex: Picanha"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Unidade</label>
                <select
                  value={form.unidade}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value as Unidade })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="KG">Quilograma (kg)</option>
                  <option value="UN">Unidade (un)</option>
                  <option value="L">Litro (L)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Qtd Atual</label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={form.quantidadeAtual}
                    onChange={(e) => setForm({ ...form, quantidadeAtual: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Nível Mínimo</label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={form.nivelMinimoAlerta}
                    onChange={(e) => setForm({ ...form, nivelMinimoAlerta: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={fecharModal} className="flex-1">Cancelar</Button>
              <Button onClick={salvarInsumo} disabled={carregando || !form.nome} className="flex-1">
                {carregando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {(modo === "entrada" || modo === "saida") && selecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={fecharModal}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {modo === "entrada" ? "Registrar Entrada" : "Registrar Saída"}
              </h2>
              <button onClick={fecharModal} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <div className="font-semibold text-slate-800">{selecionado.nome}</div>
              <div className="text-slate-500">
                Estoque atual: {formatQtd(selecionado.quantidadeAtual, selecionado.unidade)} {UNIDADE_LABEL[selecionado.unidade]}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Quantidade a {modo === "entrada" ? "adicionar" : "retirar"} ({UNIDADE_LABEL[selecionado.unidade]})
              </label>
              <input
                type="number"
                min={0.001}
                step="0.001"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="0,000"
                autoFocus
              />
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={fecharModal} className="flex-1">Cancelar</Button>
              <Button
                onClick={registrarMovimentacao}
                disabled={carregando || !quantidade || Number(quantidade) <= 0}
                className={`flex-1 ${modo === "saida" ? "border-amber-300 bg-amber-600 hover:bg-amber-700" : ""}`}
              >
                {carregando ? "..." : modo === "entrada" ? "Confirmar Entrada" : "Confirmar Saída"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
