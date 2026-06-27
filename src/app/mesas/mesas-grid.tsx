"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useMesas } from "@/hooks/useAppData";
import CupomImpressao, { DadosCupom } from "@/components/cupom-impressao";

type GrupoOpcional = { nome: string; obrigatorio: boolean; tipo: "radio" | "checkbox"; limite?: number; opcoes: string[] };
type ProdutoAPI = { id: string; nome: string; preco: string; categoria: string; opcionais?: GrupoOpcional[] | null };

type ItemPedido = {
  id: string;
  productId: string;
  quantidade: string;
  precoUnit: string;
  subtotal: string;
  observacoes?: string | null;
  product: ProdutoAPI;
};

type PedidoComItens = {
  id: string;
  mesaId: string;
  paymentStatus: string;
  total: string;
  caixaNome?: string | null;
  items: ItemPedido[];
};

type MesaComPedido = {
  id: string;
  numero: number;
  status: string;
  orders: PedidoComItens[];
};

type FormaPagamento = "DINHEIRO" | "CREDITO" | "DEBITO" | "PIX" | "VOUCHER";
type PagamentoSplit = { forma: FormaPagamento; valor: string };

const STATUS = {
  LIVRE:   { label: "Livre",   bg: "bg-green-50", border: "border-green-300", badge: "bg-green-100 text-green-800" },
  OCUPADA: { label: "Ocupada", bg: "bg-red-50",   border: "border-red-400",   badge: "bg-red-100 text-red-800" },
  CONTA:   { label: "Conta",   bg: "bg-red-100",  border: "border-red-500",   badge: "bg-red-200 text-red-900" },
} as const;

const CATEGORIAS = [
  "Lavagem",
  "Pratos do Dia",
  "Todos os Dias",
  "Acompanhamentos",
  "Lanches Tradicionais",
  "Lanches na Baguete",
  "Lanches Artesanais",
  "Porções",
  "Sucos",
  "Refrigerantes",
  "Cervejas",
  "Sobremesas",
];

const PAGAMENTOS: { valor: FormaPagamento; label: string }[] = [
  { valor: "DINHEIRO", label: "Dinheiro"      },
  { valor: "CREDITO",  label: "Crédito"       },
  { valor: "DEBITO",   label: "Débito"        },
  { valor: "PIX",      label: "Pix"           },
  { valor: "VOUCHER",  label: "Voucher VR/VA" },
];

function moeda(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MesasGrid() {
  const { data: session } = useSession();
  const nomeUsuario = session?.user?.name ?? "Sistema";
  const isTrainee = (session?.user as any)?.isTrainee ?? false;
  const role = (session?.user as any)?.role ?? "CAIXA";
  const { mesas: rawMesas, mutate } = useMesas();
  const mesas = rawMesas as MesaComPedido[];

  const [mesaIdSelecionada, setMesaIdSelecionada] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoAPI[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [opcionaisEscolhidos, setOpcionaisEscolhidos] = useState<Record<string, string[]>>({});
  const [carregando, setCarregando] = useState(false);
  const [pagamentos, setPagamentos] = useState<PagamentoSplit[]>([{ forma: "DINHEIRO", valor: "" }]);
  const [desconto, setDesconto] = useState(0);
  const [descontoInput, setDescontoInput] = useState(0);
  const [showDescontoModal, setShowDescontoModal] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const [verificandoDesconto, setVerificandoDesconto] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [caixaNome, setCaixaNome] = useState("");
  const [caixasDisponiveis, setCaixasDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [dadosCupom, setDadosCupom] = useState<DadosCupom | null>(null);

  useEffect(() => {
    fetch("/api/caixas").then((r) => r.json()).then(setCaixasDisponiveis).catch(() => {});
  }, []);
  // Estado simulado para o modo treinamento (não persiste no banco)
  const [simulado, setSimulado] = useState<Record<string, MesaComPedido>>({});

  const mesaSelecionada = mesas.find((m) => m.id === mesaIdSelecionada) ?? null;
  const mesaEfetiva = (isTrainee && mesaIdSelecionada && simulado[mesaIdSelecionada])
    ? simulado[mesaIdSelecionada]
    : mesaSelecionada;
  const pedidoAtivo = mesaEfetiva?.orders[0] ?? null;
  const statusConfig = STATUS[(mesaEfetiva?.status as keyof typeof STATUS) ?? "LIVRE"];

  const totalComDesconto = Math.max(0, Number(pedidoAtivo?.total ?? 0) - desconto);
  const totalPago = pagamentos.reduce((s, p) => s + (Number(p.valor) || 0), 0);
  const restante = Math.round((totalComDesconto - totalPago) * 100) / 100;
  const podeFechar =
    (pedidoAtivo?.items.length ?? 0) > 0 &&
    (totalComDesconto === 0 || Math.abs(restante) < 0.01);

  // Snapshot do pedido atual — alimenta o print-area enquanto o modal está aberto
  const cupomAtual: DadosCupom | null =
    pedidoAtivo && mesaEfetiva
      ? {
          mesa: mesaEfetiva.numero,
          items: pedidoAtivo.items.map((it) => ({
            quantidade: it.quantidade,
            subtotal: it.subtotal,
            observacoes: it.observacoes,
            product: { nome: it.product.nome, categoria: it.product.categoria },
          })),
          subtotal: Number(pedidoAtivo.total),
          desconto,
          total: totalComDesconto,
          pagamentos: pagamentos
            .filter((p) => Number(p.valor) > 0)
            .map((p) => ({ forma: p.forma, valor: Number(p.valor) })),
          atendente: pedidoAtivo.caixaNome || nomeUsuario,
          fechadoEm: new Date(),
        }
      : null;

  useEffect(() => {
    if (!mesaIdSelecionada) return;
    setDesconto(0);
    setDescontoInput(0);
    setSenhaAdmin("");
    setSenhaError("");
    setShowDescontoModal(false);
    setPagamentos([{ forma: "DINHEIRO", valor: "" }]);
    setCaixaNome("");
  }, [mesaIdSelecionada]);

  useEffect(() => {
    fetch("/api/produtos")
      .then((r) => r.json())
      .then((data: ProdutoAPI[]) => {
        setProdutos(data);
        if (data.length > 0) setProdutoId(data[0].id);
      })
      .catch(console.error);
  }, []);

  const produtosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    return produtos.filter((p) => {
      const matchBusca = !q || p.nome.toLowerCase().includes(q);
      const matchCat = !categoriaAtiva || p.categoria === categoriaAtiva;
      return matchBusca && matchCat;
    });
  }, [produtos, busca, categoriaAtiva]);

  const produtoSelecionado = produtos.find((p) => p.id === produtoId) ?? null;
  const gruposOpcionais = (produtoSelecionado?.opcionais ?? []) as GrupoOpcional[];
  const opcionaisObrigatoriosSatisfeitos = gruposOpcionais
    .filter((g) => g.obrigatorio)
    .every((g) => (opcionaisEscolhidos[g.nome] ?? []).length > 0);

  function selecionarProduto(id: string) {
    setProdutoId(id);
    setOpcionaisEscolhidos({});
  }

  function toggleRadio(grupoNome: string, opcao: string) {
    setOpcionaisEscolhidos((prev) => ({ ...prev, [grupoNome]: [opcao] }));
  }

  function toggleCheckbox(grupo: GrupoOpcional, opcao: string) {
    setOpcionaisEscolhidos((prev) => {
      const atual = prev[grupo.nome] ?? [];
      const jatem = atual.includes(opcao);
      if (jatem) return { ...prev, [grupo.nome]: atual.filter((o) => o !== opcao) };
      const limite = grupo.limite ?? Infinity;
      if (atual.length >= limite) return prev;
      return { ...prev, [grupo.nome]: [...atual, opcao] };
    });
  }

  async function chamarAPI(fn: () => Promise<Response>) {
    setCarregando(true);
    try {
      const res = await fn();
      if (!res.ok) throw new Error();
      mutate();
    } catch {
      alert("Ocorreu um erro. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function fecharModal() {
    setMesaIdSelecionada(null);
    setDesconto(0);
    setPagamentos([{ forma: "DINHEIRO", valor: "" }]);
    setCaixaNome("");
  }

  function atualizarPagamento(i: number, field: keyof PagamentoSplit, value: string) {
    setPagamentos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }

  function adicionarPagamento() {
    const falta = Math.max(0, restante);
    setPagamentos((prev) => [
      ...prev,
      { forma: "DINHEIRO", valor: falta > 0 ? falta.toFixed(2) : "" },
    ]);
  }

  function removerPagamento(i: number) {
    setPagamentos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function buildPagamentosPayload() {
    return pagamentos
      .filter((p) => Number(p.valor) > 0)
      .map((p) => ({ forma: p.forma, valor: Number(p.valor) }));
  }

  // ── Helpers de simulação (modo treinamento) ──────────────────────────────
  function atualizarSimulado(mesa: MesaComPedido) {
    setSimulado((prev) => ({ ...prev, [mesa.id]: mesa }));
  }
  function limparSimulado(mesaId: string) {
    setSimulado((prev) => { const { [mesaId]: _, ...rest } = prev; return rest; });
  }

  function abrirMesa() {
    if (!mesaSelecionada || !caixaNome) return;
    if (isTrainee) {
      const fakePedido: PedidoComItens = {
        id: `treino-${Date.now()}`,
        mesaId: mesaSelecionada.id,
        paymentStatus: "PENDENTE",
        total: "0.00",
        items: [],
      };
      atualizarSimulado({ ...mesaSelecionada, status: "OCUPADA", orders: [fakePedido] });
      return;
    }
    chamarAPI(() =>
      fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaId: mesaSelecionada.id, caixaNome }),
      })
    );
  }

  function buildObservacoes(): string {
    return gruposOpcionais.flatMap((g) => {
      const selecionados = opcionaisEscolhidos[g.nome] ?? [];
      if (g.tipo === "checkbox") return selecionados.map((o) => `c/ ${o}`);
      return selecionados;
    }).join(", ");
  }

  function adicionarItem() {
    if (!pedidoAtivo || !produtoId || !mesaEfetiva) return;
    const obs = buildObservacoes();
    if (isTrainee) {
      const produto = produtos.find((p) => p.id === produtoId);
      if (!produto) return;
      const semOpcional = !obs;
      const existente = semOpcional
        ? pedidoAtivo.items.find((i) => i.productId === produtoId && !i.observacoes)
        : null;
      let novosItens: ItemPedido[];
      if (existente) {
        const novaQtd = Number(existente.quantidade) + quantidade;
        novosItens = pedidoAtivo.items.map((i) =>
          i.id === existente.id
            ? { ...i, quantidade: String(novaQtd), subtotal: (Number(i.precoUnit) * novaQtd).toFixed(2) }
            : i
        );
      } else {
        novosItens = [
          ...pedidoAtivo.items,
          {
            id: `treino-item-${Date.now()}`,
            productId: produtoId,
            quantidade: String(quantidade),
            precoUnit: produto.preco,
            subtotal: (Number(produto.preco) * quantidade).toFixed(2),
            observacoes: obs || null,
            product: produto,
          },
        ];
      }
      const novoTotal = novosItens.reduce((s, i) => s + Number(i.subtotal), 0).toFixed(2);
      atualizarSimulado({ ...mesaEfetiva, orders: [{ ...pedidoAtivo, items: novosItens, total: novoTotal }] });
      setQuantidade(1);
      setOpcionaisEscolhidos({});
      return;
    }
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: produtoId, quantidade, observacoes: obs }),
      })
    ).then(() => { setQuantidade(1); setOpcionaisEscolhidos({}); });
  }

  function removerItem(itemId: string) {
    if (!pedidoAtivo || !mesaEfetiva) return;
    if (isTrainee) {
      const novosItens = pedidoAtivo.items.filter((i) => i.id !== itemId);
      const novoTotal = novosItens.reduce((s, i) => s + Number(i.subtotal), 0).toFixed(2);
      atualizarSimulado({ ...mesaEfetiva, orders: [{ ...pedidoAtivo, items: novosItens, total: novoTotal }] });
      return;
    }
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/items/${itemId}`, { method: "DELETE" })
    );
  }

  async function fecharConta() {
    if (!pedidoAtivo || !mesaEfetiva) return;
    if (isTrainee) { limparSimulado(mesaEfetiva.id); fecharModal(); return; }

    const pags = buildPagamentosPayload();
    const snapshot: DadosCupom = {
      mesa: mesaEfetiva.numero,
      items: pedidoAtivo.items.map((it) => ({
        quantidade: it.quantidade,
        subtotal: it.subtotal,
        observacoes: it.observacoes,
        product: { nome: it.product.nome, categoria: it.product.categoria },
      })),
      subtotal: Number(pedidoAtivo.total),
      desconto,
      total: totalComDesconto,
      pagamentos: pags,
      atendente: pedidoAtivo.caixaNome || nomeUsuario,
      fechadoEm: new Date(),
    };

    setCarregando(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoAtivo.id}/fechar-e-liberar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagamentos: pags.length ? pags : [{ forma: pagamentos[0].forma, valor: 0 }], desconto }),
      });
      if (!res.ok) throw new Error();
      mutate();
      fecharModal();
      setDadosCupom(snapshot);
    } catch {
      alert("Ocorreu um erro ao fechar a conta. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function fecharELiberar() {
    if (!pedidoAtivo || !mesaEfetiva) return;
    if (isTrainee) { limparSimulado(mesaEfetiva.id); fecharModal(); return; }
    const pags = buildPagamentosPayload();
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/fechar-e-liberar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagamentos: pags.length ? pags : [{ forma: pagamentos[0].forma, valor: 0 }], desconto }),
      })
    ).then(fecharModal);
  }

  function liberarMesaEmergencia() {
    if (!mesaSelecionada) return;
    if (isTrainee && mesaEfetiva) { limparSimulado(mesaEfetiva.id); fecharModal(); return; }
    chamarAPI(() =>
      fetch(`/api/mesas/${mesaSelecionada.id}/liberar`, { method: "PATCH" })
    ).then(fecharModal);
  }

  function confirmarCancelamento() {
    if (!pedidoAtivo) return;
    setShowCancelModal(false);
    if (isTrainee && mesaEfetiva) {
      limparSimulado(mesaEfetiva.id);
      fecharModal();
      setMotivoCancelamento("");
      return;
    }
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivoCancelamento, canceladoPor: nomeUsuario }),
      })
    ).then(() => { fecharModal(); setMotivoCancelamento(""); });
  }

  return (
    <>
      {/* Grade de mesas: 2 colunas no mobile, 4 no tablet, 6 no desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {mesas.map((mesa) => {
          const display = isTrainee && simulado[mesa.id] ? simulado[mesa.id] : mesa;
          const cfg = STATUS[(display.status as keyof typeof STATUS) ?? "LIVRE"];
          const pedido = display.orders[0];
          return (
            <button
              key={mesa.id}
              onClick={() => setMesaIdSelecionada(mesa.id)}
              className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4 text-left transition-opacity active:opacity-60 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-slate-400`}
            >
              <div className="text-3xl font-bold text-slate-900">{mesa.numero}</div>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
                {cfg.label}
              </span>
              {pedido && pedido.items.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  {pedido.items.length} {pedido.items.length === 1 ? "item" : "itens"} · {moeda(pedido.total)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal — bottom-sheet no mobile, centralizado no sm+ */}
      {mesaSelecionada && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50 sm:px-4"
          onClick={fecharModal}
        >
          <div
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Alça visual no mobile */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>

            <div className="p-5 sm:p-6">
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Mesa {mesaSelecionada.numero}</h2>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusConfig.badge}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <button
                  onClick={fecharModal}
                  className="p-2 text-slate-400 hover:text-slate-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {mesaEfetiva?.status === "LIVRE" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Caixa responsável <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={caixaNome}
                      onChange={(e) => setCaixaNome(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecione o caixa...</option>
                      {caixasDisponiveis.map((c) => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={abrirMesa} disabled={carregando || !caixaNome} className="w-full py-4 text-base">
                    {carregando ? "Abrindo..." : "Abrir Mesa"}
                  </Button>
                </div>
              )}

              {pedidoAtivo && (
                <div className="space-y-4">
                  {/* Itens da comanda */}
                  {pedidoAtivo.items.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">Nenhum item adicionado ainda.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {pedidoAtivo.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.product.nome}</div>
                            {item.observacoes && (
                              <div className="text-xs text-slate-400 italic">{item.observacoes}</div>
                            )}
                            <div className="text-xs text-slate-500">
                              {Number(item.quantidade)}× {moeda(item.precoUnit)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-800">{moeda(item.subtotal)}</span>
                            <button
                              onClick={() => removerItem(item.id)}
                              disabled={carregando}
                              className="px-2 py-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                            >
                              Remover
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Total */}
                  <div className="flex justify-between border-t pt-3 text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>{moeda(pedidoAtivo.total)}</span>
                  </div>

                  {/* Desconto */}
                  <div className="flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Desconto R$</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={descontoInput === 0 ? "" : descontoInput}
                        onChange={(e) => setDescontoInput(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                        className="w-24 rounded-md border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (descontoInput <= 0) return;
                          if (role === "ADMIN") {
                            setDesconto(descontoInput);
                            return;
                          }
                          setSenhaAdmin("");
                          setSenhaError("");
                          setShowDescontoModal(true);
                        }}
                        className="rounded-md bg-[#CC1111] px-3 py-2 text-xs font-semibold text-white hover:bg-[#aa0e0e] transition-colors disabled:opacity-40"
                        disabled={descontoInput <= 0}
                      >
                        Aplicar
                      </button>
                      {desconto > 0 && (
                        <span className="ml-auto text-sm font-bold text-green-700">
                          = {moeda(Math.max(0, Number(pedidoAtivo.total) - desconto))}
                        </span>
                      )}
                    </div>
                    {desconto > 0 && (
                      <p className="text-xs text-green-700 font-medium">
                        ✓ Desconto de {moeda(desconto)} autorizado
                      </p>
                    )}
                  </div>

                  {/* Modal autorização de desconto */}
                  {showDescontoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="w-80 rounded-xl bg-white p-5 shadow-xl">
                        <p className="mb-1 text-sm font-bold text-slate-800">Autorização de Desconto</p>
                        <p className="mb-4 text-xs text-slate-500">
                          Digite a senha do administrador para aplicar desconto de{" "}
                          <span className="font-semibold text-slate-700">{moeda(descontoInput)}</span>.
                        </p>
                        <input
                          type="password"
                          autoFocus
                          value={senhaAdmin}
                          onChange={(e) => { setSenhaAdmin(e.target.value); setSenhaError(""); }}
                          placeholder="Senha do administrador"
                          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#CC1111] focus:outline-none focus:ring-1 focus:ring-[#CC1111]"
                          onKeyDown={(e) => e.key === "Enter" && !verificandoDesconto && (async () => {
                            setVerificandoDesconto(true);
                            setSenhaError("");
                            try {
                              const r = await fetch("/api/admin/verify-password", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ password: senhaAdmin }),
                              });
                              if (r.ok) { setDesconto(descontoInput); setShowDescontoModal(false); }
                              else { const d = await r.json(); setSenhaError(d.error ?? "Senha incorreta"); }
                            } catch { setSenhaError("Erro de conexão"); }
                            setVerificandoDesconto(false);
                          })()}
                        />
                        {senhaError && <p className="mb-2 text-xs font-medium text-red-600">{senhaError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDescontoModal(false)}
                            className="flex-1 rounded-md border border-slate-300 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                          <button
                            disabled={verificandoDesconto || !senhaAdmin}
                            onClick={async () => {
                              setVerificandoDesconto(true);
                              setSenhaError("");
                              try {
                                const r = await fetch("/api/admin/verify-password", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ password: senhaAdmin }),
                                });
                                if (r.ok) { setDesconto(descontoInput); setShowDescontoModal(false); }
                                else { const d = await r.json(); setSenhaError(d.error ?? "Senha incorreta"); }
                              } catch { setSenhaError("Erro de conexão"); }
                              setVerificandoDesconto(false);
                            }}
                            className="flex-1 rounded-md bg-[#CC1111] py-2 text-xs font-semibold text-white hover:bg-[#aa0e0e] disabled:opacity-50"
                          >
                            {verificandoDesconto ? "Verificando..." : "Confirmar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Adicionar item */}
                  <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adicionar item</p>

                    {/* Busca */}
                    <input
                      type="text"
                      placeholder="Buscar produto..."
                      value={busca}
                      onChange={(e) => { setBusca(e.target.value); setCategoriaAtiva(null); }}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />

                    {/* Categorias */}
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
                      {CATEGORIAS.map((cat) => (
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

                    {/* Lista de produtos */}
                    <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
                      {produtosFiltrados.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs text-slate-400">Nenhum produto encontrado.</p>
                      ) : (
                        produtosFiltrados.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => selecionarProduto(p.id)}
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

                    {/* Produto selecionado + opcionais + quantidade */}
                    {produtoSelecionado && (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">

                        {/* Cabeçalho do produto */}
                        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100">
                          <span className="text-sm font-semibold text-slate-800 truncate">{produtoSelecionado.nome}</span>
                          <span className="ml-2 shrink-0 text-sm font-bold text-slate-700">{moeda(produtoSelecionado.preco)}</span>
                        </div>

                        {/* Grupos de opcionais */}
                        {gruposOpcionais.length > 0 && (
                          <div className="divide-y divide-slate-100">
                            {gruposOpcionais.map((grupo) => {
                              const selecionados = opcionaisEscolhidos[grupo.nome] ?? [];
                              const atingiuLimite = grupo.tipo === "checkbox" && grupo.limite != null && selecionados.length >= grupo.limite;
                              return (
                                <div key={grupo.nome} className="px-3 py-3">
                                  {/* Label do grupo */}
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                      {grupo.nome}
                                      {grupo.obrigatorio && <span className="ml-1 text-red-500">*</span>}
                                    </p>
                                    {grupo.tipo === "checkbox" && grupo.limite != null && (
                                      <span className="text-xs text-slate-400">
                                        {selecionados.length}/{grupo.limite}
                                      </span>
                                    )}
                                  </div>

                                  {/* Opções — Radio */}
                                  {(grupo.tipo === "radio" || !grupo.tipo) && (
                                    <div className="flex flex-wrap gap-2">
                                      {grupo.opcoes.map((opcao) => {
                                        const ativo = selecionados[0] === opcao;
                                        return (
                                          <button
                                            key={opcao}
                                            type="button"
                                            onClick={() => toggleRadio(grupo.nome, opcao)}
                                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                                              ativo
                                                ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                                            }`}
                                          >
                                            <span className={`h-3 w-3 shrink-0 rounded-full border-2 flex items-center justify-center ${ativo ? "border-white" : "border-slate-400"}`}>
                                              {ativo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                            </span>
                                            {opcao}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Opções — Checkbox */}
                                  {grupo.tipo === "checkbox" && (
                                    <div className="flex flex-wrap gap-2">
                                      {grupo.opcoes.map((opcao) => {
                                        const marcado = selecionados.includes(opcao);
                                        const bloqueado = !marcado && atingiuLimite;
                                        return (
                                          <button
                                            key={opcao}
                                            type="button"
                                            disabled={bloqueado}
                                            onClick={() => toggleCheckbox(grupo, opcao)}
                                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                                              marcado
                                                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                                                : bloqueado
                                                ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                                            }`}
                                          >
                                            <span className={`h-3 w-3 shrink-0 rounded border flex items-center justify-center ${marcado ? "border-white bg-white/20" : "border-current"}`}>
                                              {marcado && (
                                                <svg viewBox="0 0 10 10" className="h-2 w-2 fill-white">
                                                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                              )}
                                            </span>
                                            {opcao}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Preview das escolhas */}
                        {gruposOpcionais.length > 0 && buildObservacoes() && (
                          <div className="mx-3 mb-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500 italic">
                            {buildObservacoes()}
                          </div>
                        )}

                        {/* Aviso de obrigatório não preenchido */}
                        {gruposOpcionais.length > 0 && !opcionaisObrigatoriosSatisfeitos && (
                          <p className="px-3 pb-1 text-xs text-red-500 font-medium">
                            ⚠ Selecione as opções obrigatórias (*)
                          </p>
                        )}

                        {/* Linha quantidade + botão */}
                        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100">
                          <label className="text-xs text-slate-500 shrink-0">Qtd.</label>
                          <input
                            type="number"
                            min={1}
                            value={quantidade}
                            onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                            className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                          <button
                            onClick={adicionarItem}
                            disabled={carregando || !produtoId || !opcionaisObrigatoriosSatisfeitos}
                            className="flex-1 rounded-lg bg-[#CC1111] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#aa0e0e] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                          >
                            {carregando ? "Adicionando..." : "Adicionar"}
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Pagamento */}
                  <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pagamento</p>

                    {pagamentos.map((pag, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={pag.forma}
                          onChange={(e) => atualizarPagamento(i, "forma", e.target.value)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                          {PAGAMENTOS.map(({ valor, label }) => (
                            <option key={valor} value={valor}>{label}</option>
                          ))}
                        </select>
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={pag.valor}
                            onChange={(e) => atualizarPagamento(i, "valor", e.target.value)}
                            className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            placeholder="0,00"
                          />
                        </div>
                        {pagamentos.length > 1 && (
                          <button
                            onClick={() => removerPagamento(i)}
                            className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Restante */}
                    <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
                      Math.abs(restante) < 0.01
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-50 text-slate-600"
                    }`}>
                      <span>Restante</span>
                      <span>{restante.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>

                    {/* Botão adicionar forma */}
                    {restante > 0.005 && (
                      <button
                        onClick={adicionarPagamento}
                        className="w-full rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-500 hover:text-slate-700 transition-colors"
                      >
                        + Adicionar forma de pagamento
                      </button>
                    )}
                  </div>

                  {/* Botões de ação principais — py-4 para polegar */}
                  <Button
                    onClick={fecharConta}
                    disabled={carregando || !podeFechar}
                    className="w-full py-4 text-base bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {carregando ? "Fechando..." : "Fechar Conta"}
                  </Button>

                  {cupomAtual && (
                    <button
                      onClick={() => window.print()}
                      className="w-full rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimir Cupom
                    </button>
                  )}

                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={carregando}
                    className="w-full rounded-lg border border-red-300 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 active:bg-red-100"
                  >
                    Cancelar Pedido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center bg-black/60 sm:px-4">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <div className="p-6">
              <h3 className="mb-1 text-lg font-bold text-slate-900">Cancelar mesa {mesaSelecionada?.numero}?</h3>
              <p className="mb-4 text-sm text-slate-500">Todos os itens serão descartados.</p>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Motivo do cancelamento <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Informe o motivo..."
                rows={3}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                  !motivoCancelamento.trim() ? "border-red-300" : "border-slate-300"
                }`}
              />
              {!motivoCancelamento.trim() && (
                <p className="mt-1 text-xs text-red-500">O motivo é obrigatório para cancelar o pedido.</p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Voltar
                </button>
                <button
                  onClick={confirmarCancelamento}
                  disabled={carregando || !motivoCancelamento.trim()}
                  className="flex-1 rounded-lg bg-red-600 py-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirmar cancelamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Área de impressão — oculta na tela, sempre disponível quando há pedido ativo ou pós-fechamento */}
      {(cupomAtual ?? dadosCupom) && (
        <CupomImpressao dados={(cupomAtual ?? dadosCupom)!} />
      )}

      {/* Overlay pós-pagamento */}
      {dadosCupom && (
        <>
          {/* (print-area já renderizado acima via dadosCupom) */}

          {/* Modal de confirmação */}
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center sm:justify-center bg-black/60 sm:px-4">
            <div className="w-full sm:max-w-xs rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-slate-300" />
              </div>

              <div className="p-6">
                {/* Ícone de sucesso */}
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Conta fechada!</h3>
                  <p className="text-sm text-slate-500">
                    Mesa {dadosCupom.mesa} · {dadosCupom.fechadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* Resumo financeiro */}
                <div className="mb-5 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
                  {dadosCupom.desconto > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{moeda(dadosCupom.subtotal)}</span>
                    </div>
                  )}
                  {dadosCupom.desconto > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Desconto</span>
                      <span>− {moeda(dadosCupom.desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total pago</span>
                    <span>{moeda(dadosCupom.total)}</span>
                  </div>
                  {dadosCupom.pagamentos.filter((p) => p.valor > 0).map((pag, i) => (
                    <div key={i} className="flex justify-between text-slate-500 text-xs">
                      <span>{PAGAMENTOS.find((p) => p.valor === pag.forma)?.label ?? pag.forma}</span>
                      <span>{moeda(pag.valor)}</span>
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => window.print()}
                    className="w-full rounded-xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir Cupom
                  </button>
                  <button
                    onClick={() => setDadosCupom(null)}
                    className="w-full rounded-xl border border-slate-300 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                  >
                    Fechar sem imprimir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
