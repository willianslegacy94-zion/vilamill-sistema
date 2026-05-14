"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Produto = { id: string; nome: string; categoria: string; preco: string };
type Insumo = { id: string; nome: string; unidade: string };
type ReceitaItem = { id: string; quantidade: string; ingredient: Insumo };
type Modo = "novo" | "editar" | "receita" | null;

const UNIDADE: Record<string, string> = { KG: "kg", UN: "un", L: "L" };

function moeda(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutosTable({ produtos, categorias }: { produtos: Produto[]; categorias: string[] }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(null);
  const [selecionado, setSelecionado] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [form, setForm] = useState({ nome: "", categoria: "", preco: "" });
  const [novaCategoria, setNovaCategoria] = useState(false);

  // Ficha técnica
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [receitaItens, setReceitaItens] = useState<ReceitaItem[]>([]);
  const [receitaInsumoId, setReceitaInsumoId] = useState("");
  const [receitaQtd, setReceitaQtd] = useState("");
  const [receitaCarregando, setReceitaCarregando] = useState(false);

  const grupos = categorias.map((cat) => ({
    categoria: cat,
    itens: produtos.filter((p) => p.categoria === cat),
  }));

  useEffect(() => {
    fetch("/api/insumos")
      .then((r) => r.json())
      .then((data: Insumo[]) => {
        setInsumos(data);
        if (data.length > 0) setReceitaInsumoId(data[0].id);
      })
      .catch(console.error);
  }, []);

  const carregarReceita = useCallback(async (produtoId: string) => {
    setReceitaCarregando(true);
    try {
      const res = await fetch(`/api/produtos/${produtoId}/receita`);
      const data: ReceitaItem[] = await res.json();
      setReceitaItens(data);
    } finally {
      setReceitaCarregando(false);
    }
  }, []);

  function abrirNovo() {
    setForm({ nome: "", categoria: categorias[0] ?? "", preco: "" });
    setNovaCategoria(categorias.length === 0);
    setSelecionado(null);
    setModo("novo");
  }

  function abrirEditar(produto: Produto) {
    setSelecionado(produto);
    setForm({ nome: produto.nome, categoria: produto.categoria, preco: Number(produto.preco).toFixed(2) });
    setNovaCategoria(false);
    setModo("editar");
  }

  function abrirReceita(produto: Produto) {
    setSelecionado(produto);
    setReceitaQtd("");
    setModo("receita");
    carregarReceita(produto.id);
  }

  function fecharModal() {
    setModo(null);
    setSelecionado(null);
  }

  async function chamarAPI(fn: () => Promise<Response>, fechar = true) {
    setCarregando(true);
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro desconhecido");
      }
      router.refresh();
      if (fechar) fecharModal();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Ocorreu um erro. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function salvar() {
    if (!form.nome || !form.categoria || !form.preco) return;
    const url = modo === "novo" ? "/api/produtos" : `/api/produtos/${selecionado!.id}`;
    const method = modo === "novo" ? "POST" : "PATCH";
    chamarAPI(() =>
      fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: form.nome, categoria: form.categoria, preco: Number(form.preco) }),
      })
    );
  }

  function excluir(produto: Produto) {
    if (!confirm(`Excluir "${produto.nome}"?`)) return;
    chamarAPI(() => fetch(`/api/produtos/${produto.id}`, { method: "DELETE" }));
  }

  async function adicionarIngrediente() {
    if (!selecionado || !receitaInsumoId || !receitaQtd) return;
    setReceitaCarregando(true);
    try {
      const res = await fetch(`/api/produtos/${selecionado.id}/receita`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientId: receitaInsumoId, quantidade: Number(receitaQtd) }),
      });
      if (!res.ok) throw new Error();
      setReceitaQtd("");
      await carregarReceita(selecionado.id);
    } catch {
      alert("Erro ao adicionar ingrediente.");
    } finally {
      setReceitaCarregando(false);
    }
  }

  async function removerIngrediente(itemId: string) {
    if (!selecionado) return;
    setReceitaCarregando(true);
    try {
      await fetch(`/api/produtos/${selecionado.id}/receita/${itemId}`, { method: "DELETE" });
      await carregarReceita(selecionado.id);
    } finally {
      setReceitaCarregando(false);
    }
  }

  const insumoSelecionado = insumos.find((i) => i.id === receitaInsumoId);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={abrirNovo}>+ Novo Produto</Button>
      </div>

      <div className="space-y-6">
        {grupos.map(({ categoria, itens }) => (
          <div key={categoria}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">{categoria}</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Nome</th>
                    <th className="px-4 py-3 text-right">Preço</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((p) => (
                    <tr key={p.id} className="bg-white">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.nome}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{moeda(p.preco)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-50" onClick={() => abrirReceita(p)}>
                            Ficha Técnica
                          </Button>
                          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => abrirEditar(p)}>
                            Editar
                          </Button>
                          <Button variant="ghost" className="h-8 px-2 text-xs text-red-500 hover:bg-red-50" onClick={() => excluir(p)}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {produtos.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Nenhum produto cadastrado.</p>
        )}
      </div>

      {/* Modal Novo / Editar */}
      {(modo === "novo" || modo === "editar") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={fecharModal}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{modo === "novo" ? "Novo Produto" : "Editar Produto"}</h2>
              <button onClick={fecharModal} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nome</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Ex: Picanha Grelhada" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Categoria</label>
                {!novaCategoria && categorias.length > 0 ? (
                  <select
                    value={form.categoria}
                    onChange={(e) => {
                      if (e.target.value === "__nova__") {
                        setNovaCategoria(true);
                        setForm({ ...form, categoria: "" });
                      } else {
                        setForm({ ...form, categoria: e.target.value });
                      }
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__nova__">+ Nova categoria...</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="Nome da nova categoria"
                      autoFocus
                    />
                    {categorias.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setNovaCategoria(false); setForm({ ...form, categoria: categorias[0] }); }}
                        className="rounded-md border border-slate-300 px-2 py-2 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Preço (R$)</label>
                <input type="number" min={0} step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="0,00" />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={fecharModal} className="flex-1">Cancelar</Button>
              <Button onClick={salvar} disabled={carregando || !form.nome || !form.categoria || !form.preco} className="flex-1">
                {carregando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha Técnica */}
      {modo === "receita" && selecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={fecharModal}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Ficha Técnica</h2>
              <button onClick={fecharModal} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <p className="mb-4 text-sm text-slate-500">{selecionado.nome}</p>

            {/* Ingredientes da receita */}
            {receitaCarregando && receitaItens.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Carregando...</p>
            ) : receitaItens.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Nenhum ingrediente na ficha técnica.</p>
            ) : (
              <ul className="mb-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {receitaItens.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{item.ingredient.nome}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {Number(item.quantidade).toFixed(3)} {UNIDADE[item.ingredient.unidade] ?? item.ingredient.unidade} / porção
                      </span>
                    </div>
                    <button
                      onClick={() => removerIngrediente(item.id)}
                      disabled={receitaCarregando}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Adicionar ingrediente */}
            <div className="space-y-2 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adicionar ingrediente</p>
              <select
                value={receitaInsumoId}
                onChange={(e) => setReceitaInsumoId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>{i.nome} ({UNIDADE[i.unidade] ?? i.unidade})</option>
                ))}
              </select>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0.001}
                    step="0.001"
                    value={receitaQtd}
                    onChange={(e) => setReceitaQtd(e.target.value)}
                    placeholder="0,000"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  {insumoSelecionado && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {UNIDADE[insumoSelecionado.unidade]}
                    </span>
                  )}
                </div>
                <Button
                  onClick={adicionarIngrediente}
                  disabled={receitaCarregando || !receitaQtd || Number(receitaQtd) <= 0}
                >
                  {receitaCarregando ? "..." : "Adicionar"}
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Button variant="outline" onClick={fecharModal} className="w-full">Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
