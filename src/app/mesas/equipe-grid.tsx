"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

type ProdutoAPI = { id: string; nome: string; preco: string; categoria: string };
type FuncionarioAPI = { id: string; nome: string; empresa: string; setor: string };

const EMPRESA_EQUIPE = "Equipe Villa Mill";

function moeda(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EquipeGrid() {
  const { data: session } = useSession();
  const registradoPor = session?.user?.email ?? session?.user?.name ?? "sistema";

  const [pessoas, setPessoas] = useState<FuncionarioAPI[]>([]);
  const [produtos, setProdutos] = useState<ProdutoAPI[]>([]);
  const [pessoaId, setPessoaId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    fetch("/api/parceiros/funcionarios")
      .then((r) => r.json())
      .then((data: FuncionarioAPI[]) => setPessoas(data.filter((f) => f.empresa === EMPRESA_EQUIPE)))
      .catch(console.error);
    fetch("/api/produtos")
      .then((r) => r.json())
      .then((data: ProdutoAPI[]) => setProdutos(data))
      .catch(console.error);
  }, []);

  const pessoaSelecionada = pessoas.find((p) => p.id === pessoaId) ?? null;

  const produtosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    return produtos.filter((p) => {
      const matchBusca = !q || p.nome.toLowerCase().includes(q);
      const matchCat = !categoriaAtiva || p.categoria === categoriaAtiva;
      return matchBusca && matchCat;
    });
  }, [produtos, busca, categoriaAtiva]);

  const categoriasDisponiveis = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria))).sort(),
    [produtos]
  );

  const produtoSelecionado = produtos.find((p) => p.id === produtoId) ?? null;

  function abrirModal(id: string) {
    setPessoaId(id);
    setBusca("");
    setCategoriaAtiva(null);
    setProdutoId("");
    setQuantidade(1);
    setErro("");
    setOk("");
  }

  function fecharModal() {
    setPessoaId(null);
  }

  async function registrarConsumo() {
    if (!pessoaId || !produtoId) return;
    setSalvando(true);
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/parceiros/consumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionarioId: pessoaId,
          productId: produtoId,
          quantidade,
          registradoPor,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao registrar consumo."); return; }
      setOk(`${quantidade}× ${produtoSelecionado?.nome} registrado para ${pessoaSelecionada?.nome}.`);
      setProdutoId("");
      setQuantidade(1);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {pessoas.map((pessoa) => (
          <button
            key={pessoa.id}
            onClick={() => abrirModal(pessoa.id)}
            className="rounded-xl border-2 border-slate-300 bg-slate-50 p-4 text-left transition-opacity active:opacity-60 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <div className="text-2xl">👤</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{pessoa.nome}</div>
          </button>
        ))}
      </div>

      {pessoaSelecionada && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50 sm:px-4"
          onClick={fecharModal}
        >
          <div
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-xl font-bold text-slate-900">{pessoaSelecionada.nome}</h2>
                <button
                  onClick={fecharModal}
                  className="p-2 text-slate-400 hover:text-slate-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registrar consumo</p>

                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) => { setBusca(e.target.value); setCategoriaAtiva(null); }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => { setCategoriaAtiva(null); setBusca(""); }}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      !categoriaAtiva && !busca
                        ? "bg-slate-800 text-white"
                        : "bg-white border border-slate-300 text-slate-600 hover:border-slate-500"
                    }`}
                  >
                    Todos
                  </button>
                  {categoriasDisponiveis.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategoriaAtiva(cat); setBusca(""); }}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        categoriaAtiva === cat
                          ? "bg-slate-800 text-white"
                          : "bg-white border border-slate-300 text-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
                  {produtosFiltrados.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-slate-400">Nenhum produto encontrado.</p>
                  ) : (
                    produtosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setProdutoId(p.id); setErro(""); setOk(""); }}
                        className={`w-full flex items-center justify-between px-3 py-3 text-left text-sm transition-colors active:bg-slate-100 hover:bg-slate-50 ${
                          produtoId === p.id ? "bg-slate-100 font-semibold" : ""
                        }`}
                      >
                        <span className="text-slate-800">{p.nome}</span>
                        <span className="ml-2 shrink-0 text-xs font-semibold text-slate-500">{moeda(p.preco)}</span>
                      </button>
                    ))
                  )}
                </div>

                {produtoSelecionado && (
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100">
                      <span className="text-sm font-semibold text-slate-800 truncate">{produtoSelecionado.nome}</span>
                      <span className="ml-2 shrink-0 text-sm font-bold text-slate-700">{moeda(produtoSelecionado.preco)}</span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <label className="text-xs text-slate-500 shrink-0">Qtd.</label>
                      <input
                        type="number"
                        min={1}
                        value={quantidade}
                        onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                        className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <button
                        onClick={registrarConsumo}
                        disabled={salvando || !produtoId}
                        className="flex-1 rounded-lg bg-[#CC1111] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#aa0e0e] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        {salvando ? "Registrando..." : "Registrar Consumo"}
                      </button>
                    </div>
                  </div>
                )}

                {erro && <p className="text-xs font-semibold text-red-600">{erro}</p>}
                {ok && (
                  <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {ok}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
