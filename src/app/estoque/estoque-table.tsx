"use client";

import { useState, useMemo } from "react";
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

type ProdutoEstoque = {
  id: string;
  nome: string;
  categoria: string;
  estoque: string;
};

type MovItem =
  | { tipo: "insumo"; item: Insumo }
  | { tipo: "produto"; item: ProdutoEstoque };

type Modo = "novo" | "editar" | "entrada" | "saida" | null;

const UNIDADE_LABEL: Record<Unidade, string> = { KG: "kg", UN: "un", L: "L" };

function emAlerta(insumo: Insumo) {
  return Number(insumo.quantidadeAtual) <= Number(insumo.nivelMinimoAlerta);
}

function formatQtd(valor: string, unidade?: Unidade) {
  const n = Number(valor);
  if (!unidade || unidade === "UN") return String(Math.floor(n));
  return n.toFixed(3).replace(".", ",");
}

export default function EstoqueTable({
  insumos,
  produtos = [],
  categorias = [],
  isAdmin = false,
}: {
  insumos: Insumo[];
  produtos?: ProdutoEstoque[];
  categorias?: string[];
  isAdmin?: boolean;
}) {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("Todas");

  const [modo, setModo] = useState<Modo>(null);
  const [insumoEdit, setInsumoEdit] = useState<Insumo | null>(null);
  const [movItem, setMovItem] = useState<MovItem | null>(null);
  const [form, setForm] = useState({ nome: "", unidade: "KG" as Unidade, quantidadeAtual: "", nivelMinimoAlerta: "" });
  const [quantidade, setQuantidade] = useState("");
  const [carregando, setCarregando] = useState(false);

  const produtosFiltrados = useMemo(() => {
    if (categoriaSel === "Insumos") return [];
    return produtos.filter((p) => {
      const matchNome = !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
      const matchCat = categoriaSel === "Todas" || p.categoria === categoriaSel;
      return matchNome && matchCat;
    });
  }, [produtos, busca, categoriaSel]);

  const insumosFiltrados = useMemo(() => {
    if (categoriaSel !== "Todas" && categoriaSel !== "Insumos") return [];
    return insumos.filter((i) =>
      !busca || i.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [insumos, busca, categoriaSel]);

  const alertas = insumos.filter(emAlerta);

  function abrirNovo() {
    setForm({ nome: "", unidade: "KG", quantidadeAtual: "", nivelMinimoAlerta: "" });
    setModo("novo");
  }

  function abrirEditar(insumo: Insumo) {
    setInsumoEdit(insumo);
    setForm({
      nome: insumo.nome,
      unidade: insumo.unidade,
      quantidadeAtual: Number(insumo.quantidadeAtual).toString(),
      nivelMinimoAlerta: Number(insumo.nivelMinimoAlerta).toString(),
    });
    setModo("editar");
  }

  function abrirMov(item: MovItem, tipo: "entrada" | "saida") {
    setMovItem(item);
    setQuantidade("");
    setModo(tipo);
  }

  function fecharModal() {
    setModo(null);
    setInsumoEdit(null);
    setMovItem(null);
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
    const url = modo === "novo" ? "/api/insumos" : `/api/insumos/${insumoEdit!.id}`;
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
    if (!movItem || !quantidade || Number(quantidade) <= 0) return;
    const delta = modo === "entrada" ? Number(quantidade) : -Number(quantidade);
    const url =
      movItem.tipo === "produto"
        ? `/api/produtos/${movItem.item.id}`
        : `/api/insumos/${movItem.item.id}`;
    chamarAPI(() =>
      fetch(url, {
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

  const nomeMovItem = movItem?.item.nome ?? "";
  const estoqueAtualMovItem =
    movItem?.tipo === "produto"
      ? `${formatQtd(movItem.item.estoque)} un`
      : movItem?.tipo === "insumo"
      ? `${formatQtd(movItem.item.quantidadeAtual, movItem.item.unidade)} ${UNIDADE_LABEL[movItem.item.unidade]}`
      : "";
  const stepMovItem = movItem?.tipo === "insumo" ? "0.001" : "1";
  const minMovItem = movItem?.tipo === "insumo" ? 0.001 : 1;
  const labelUnidadeMovItem =
    movItem?.tipo === "insumo" ? ` (${UNIDADE_LABEL[movItem.item.unidade]})` : " (un)";

  return (
    <>
      {alertas.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">
            ⚠ {alertas.length} {alertas.length === 1 ? "insumo abaixo" : "insumos abaixo"} do nível mínimo:
          </span>
          <span>{alertas.map((i) => i.nome).join(", ")}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={categoriaSel}
          onChange={(e) => setCategoriaSel(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="Todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          {insumos.length > 0 && <option value="Insumos">Insumos</option>}
        </select>
        {isAdmin && <Button onClick={abrirNovo}>+ Novo Insumo</Button>}
      </div>

      {/* Produtos em estoque */}
      {produtosFiltrados.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Produtos em Estoque
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-right">Qtd Atual</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {produtosFiltrados.map((produto) => (
                <tr key={produto.id} className="bg-white">
                  <td className="px-4 py-3 font-medium text-slate-900">{produto.nome}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {produto.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatQtd(produto.estoque)} un
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs text-green-700 hover:bg-green-50"
                        onClick={() => abrirMov({ tipo: "produto", item: produto }, "entrada")}
                      >
                        Entrada
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs text-amber-700 hover:bg-amber-50"
                        onClick={() => abrirMov({ tipo: "produto", item: produto }, "saida")}
                      >
                        Saída
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insumos */}
      {(categoriaSel === "Todas" || categoriaSel === "Insumos") && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {produtosFiltrados.length > 0 && (
            <div className="bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Insumos
            </div>
          )}
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
              {insumosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {insumos.length === 0
                      ? "Nenhum insumo cadastrado."
                      : "Nenhum insumo encontrado."}
                  </td>
                </tr>
              )}
              {insumosFiltrados.map((insumo) => {
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
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          alerta ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {alerta ? "Alerta" : "OK"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs text-green-700 hover:bg-green-50"
                          onClick={() => abrirMov({ tipo: "insumo", item: insumo }, "entrada")}
                        >
                          Entrada
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs text-amber-700 hover:bg-amber-50"
                          onClick={() => abrirMov({ tipo: "insumo", item: insumo }, "saida")}
                        >
                          Saída
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => abrirEditar(insumo)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 px-2 text-xs text-red-500 hover:bg-red-50"
                              onClick={() => excluir(insumo)}
                            >
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Novo / Editar Insumo */}
      {isAdmin && (modo === "novo" || modo === "editar") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={fecharModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {modo === "novo" ? "Novo Insumo" : "Editar Insumo"}
              </h2>
              <button onClick={fecharModal} className="text-xl text-slate-400 hover:text-slate-600">
                ×
              </button>
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
              <Button variant="outline" onClick={fecharModal} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={salvarInsumo} disabled={carregando || !form.nome} className="flex-1">
                {carregando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Entrada / Saída */}
      {(modo === "entrada" || modo === "saida") && movItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={fecharModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {modo === "entrada" ? "Registrar Entrada" : "Registrar Saída"}
              </h2>
              <button onClick={fecharModal} className="text-xl text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>
            <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <div className="font-semibold text-slate-800">{nomeMovItem}</div>
              <div className="text-slate-500">Estoque atual: {estoqueAtualMovItem}</div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Quantidade a {modo === "entrada" ? "adicionar" : "retirar"}
                {labelUnidadeMovItem}
              </label>
              <input
                type="number"
                min={minMovItem}
                step={stepMovItem}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder={movItem.tipo === "insumo" ? "0,000" : "0"}
                autoFocus
              />
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={fecharModal} className="flex-1">
                Cancelar
              </Button>
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
