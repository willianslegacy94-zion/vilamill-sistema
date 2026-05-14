"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

type ProdutoAPI = { id: string; nome: string; preco: string; categoria: string };

type ItemPedido = {
  id: string;
  productId: string;
  quantidade: string;
  precoUnit: string;
  subtotal: string;
  product: ProdutoAPI;
};

type PedidoComItens = {
  id: string;
  mesaId: string;
  paymentStatus: string;
  total: string;
  items: ItemPedido[];
};

type MesaComPedido = {
  id: string;
  numero: number;
  status: string;
  orders: PedidoComItens[];
};

type FormaPagamento = "DINHEIRO" | "CREDITO" | "DEBITO" | "PIX";
type PagamentoSplit = { forma: FormaPagamento; valor: string };

const STATUS = {
  LIVRE:   { label: "Livre",   bg: "bg-green-50", border: "border-green-300", badge: "bg-green-100 text-green-800" },
  OCUPADA: { label: "Ocupada", bg: "bg-red-50",   border: "border-red-400",   badge: "bg-red-100 text-red-800" },
  CONTA:   { label: "Conta",   bg: "bg-red-100",  border: "border-red-500",   badge: "bg-red-200 text-red-900" },
} as const;

const CATEGORIAS = [
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
  { valor: "DINHEIRO", label: "Dinheiro" },
  { valor: "CREDITO",  label: "Crédito"  },
  { valor: "DEBITO",   label: "Débito"   },
  { valor: "PIX",      label: "Pix"      },
];

function moeda(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MesasGrid({ mesas }: { mesas: MesaComPedido[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const nomeUsuario = session?.user?.name ?? "Sistema";
  const isTrainee = (session?.user as any)?.isTrainee ?? false;

  const [mesaIdSelecionada, setMesaIdSelecionada] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoAPI[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [pagamentos, setPagamentos] = useState<PagamentoSplit[]>([{ forma: "DINHEIRO", valor: "" }]);
  const [desconto, setDesconto] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
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

  useEffect(() => {
    if (!mesaIdSelecionada) return;
    setDesconto(0);
    setPagamentos([{ forma: "DINHEIRO", valor: "" }]);
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

  async function chamarAPI(fn: () => Promise<Response>) {
    setCarregando(true);
    try {
      const res = await fn();
      if (!res.ok) throw new Error();
      router.refresh();
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
    if (!mesaSelecionada) return;
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
        body: JSON.stringify({ mesaId: mesaSelecionada.id }),
      })
    );
  }

  function adicionarItem() {
    if (!pedidoAtivo || !produtoId || !mesaEfetiva) return;
    if (isTrainee) {
      const produto = produtos.find((p) => p.id === produtoId);
      if (!produto) return;
      const existente = pedidoAtivo.items.find((i) => i.productId === produtoId);
      let novosItens: ItemPedido[];
      if (existente) {
        const novaQtd = Number(existente.quantidade) + quantidade;
        novosItens = pedidoAtivo.items.map((i) =>
          i.productId === produtoId
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
            product: produto,
          },
        ];
      }
      const novoTotal = novosItens.reduce((s, i) => s + Number(i.subtotal), 0).toFixed(2);
      atualizarSimulado({ ...mesaEfetiva, orders: [{ ...pedidoAtivo, items: novosItens, total: novoTotal }] });
      setQuantidade(1);
      return;
    }
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: produtoId, quantidade }),
      })
    ).then(() => setQuantidade(1));
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

  function fecharConta() {
    if (!pedidoAtivo || !mesaEfetiva) return;
    if (isTrainee) { limparSimulado(mesaEfetiva.id); fecharModal(); return; }
    const pags = buildPagamentosPayload();
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/fechar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagamentos: pags.length ? pags : [{ forma: pagamentos[0].forma, valor: 0 }], desconto }),
      })
    ).then(fecharModal);
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
                <Button onClick={abrirMesa} disabled={carregando} className="w-full py-4 text-base">
                  {carregando ? "Abrindo..." : "Abrir Mesa"}
                </Button>
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
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3">
                    <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Desconto R$</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={desconto}
                      onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))}
                      className="w-24 rounded-md border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                    {desconto > 0 && (
                      <span className="ml-auto text-sm font-bold text-green-700">
                        = {moeda(Math.max(0, Number(pedidoAtivo.total) - desconto))}
                      </span>
                    )}
                  </div>

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
                            onClick={() => setProdutoId(p.id)}
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

                    {/* Produto selecionado + quantidade */}
                    {produtoSelecionado && (
                      <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2">
                        <span className="flex-1 truncate text-xs font-medium text-slate-700">
                          {produtoSelecionado.nome}
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={quantidade}
                          onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                          className="w-16 rounded-md border border-slate-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                        <Button
                          onClick={adicionarItem}
                          disabled={carregando || !produtoId}
                          className="shrink-0 px-4 py-2.5"
                        >
                          {carregando ? "..." : "Adicionar"}
                        </Button>
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
                    variant="outline"
                    className="w-full py-4 text-base border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {carregando ? "Fechando..." : "Fechar Conta"}
                  </Button>

                  <Button
                    onClick={fecharELiberar}
                    disabled={carregando || !podeFechar}
                    className="w-full py-4 text-base bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {carregando ? "Processando..." : "Fechar e Liberar Mesa"}
                  </Button>

                  <button
                    onClick={liberarMesaEmergencia}
                    disabled={carregando}
                    className="w-full rounded-lg border border-amber-300 py-4 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-40 active:bg-amber-100"
                  >
                    Liberar Mesa (emergência)
                  </button>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={carregando}
                    className="w-full py-3 text-sm text-slate-400 hover:text-red-500 disabled:opacity-40"
                  >
                    Cancelar e liberar mesa
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
              <textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Motivo (opcional)"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Voltar
                </button>
                <button
                  onClick={confirmarCancelamento}
                  disabled={carregando}
                  className="flex-1 rounded-lg bg-red-600 py-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Confirmar cancelamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
