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

  const [mesaIdSelecionada, setMesaIdSelecionada] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoAPI[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("DINHEIRO");
  const [desconto, setDesconto] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  const mesaSelecionada = mesas.find((m) => m.id === mesaIdSelecionada) ?? null;
  const pedidoAtivo = mesaSelecionada?.orders[0] ?? null;
  const statusConfig = STATUS[(mesaSelecionada?.status as keyof typeof STATUS) ?? "LIVRE"];

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

  function abrirMesa() {
    if (!mesaSelecionada) return;
    chamarAPI(() =>
      fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaId: mesaSelecionada.id }),
      })
    );
  }

  function adicionarItem() {
    if (!pedidoAtivo || !produtoId) return;
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: produtoId, quantidade }),
      })
    ).then(() => setQuantidade(1));
  }

  function removerItem(itemId: string) {
    if (!pedidoAtivo) return;
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/items/${itemId}`, { method: "DELETE" })
    );
  }

  function fecharConta() {
    if (!pedidoAtivo) return;
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/fechar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formaPagamento, desconto }),
      })
    ).then(() => { setMesaIdSelecionada(null); setDesconto(0); });
  }

  function fecharELiberar() {
    if (!pedidoAtivo) return;
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}/fechar-e-liberar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formaPagamento, desconto }),
      })
    ).then(() => { setMesaIdSelecionada(null); setDesconto(0); });
  }

  function liberarMesaEmergencia() {
    if (!mesaSelecionada) return;
    chamarAPI(() =>
      fetch(`/api/mesas/${mesaSelecionada.id}/liberar`, { method: "PATCH" })
    ).then(() => setMesaIdSelecionada(null));
  }

  function confirmarCancelamento() {
    if (!pedidoAtivo) return;
    setShowCancelModal(false);
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivoCancelamento, canceladoPor: nomeUsuario }),
      })
    ).then(() => { setMesaIdSelecionada(null); setMotivoCancelamento(""); });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {mesas.map((mesa) => {
          const cfg = STATUS[(mesa.status as keyof typeof STATUS) ?? "LIVRE"];
          const pedido = mesa.orders[0];
          return (
            <button
              key={mesa.id}
              onClick={() => setMesaIdSelecionada(mesa.id)}
              className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4 text-left transition-opacity hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-slate-400`}
            >
              <div className="text-3xl font-bold text-slate-900">{mesa.numero}</div>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
                {cfg.label}
              </span>
              {pedido && (
                <div className="mt-2 text-xs text-slate-500">
                  {pedido.items.length} {pedido.items.length === 1 ? "item" : "itens"} · {moeda(pedido.total)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {mesaSelecionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setMesaIdSelecionada(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Mesa {mesaSelecionada.numero}</h2>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusConfig.badge}`}>
                  {statusConfig.label}
                </span>
              </div>
              <button
                onClick={() => setMesaIdSelecionada(null)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {mesaSelecionada.status === "LIVRE" && (
              <Button onClick={abrirMesa} disabled={carregando} className="w-full">
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
                      <li key={item.id} className="flex items-center justify-between py-2.5">
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
                            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
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
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Desconto R$</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={desconto}
                    onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />

                  {/* Categorias */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={() => { setCategoriaAtiva(null); setBusca(""); }}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
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
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
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
                          className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
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
                        className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <Button
                        onClick={adicionarItem}
                        disabled={carregando || !produtoId}
                        className="shrink-0"
                      >
                        {carregando ? "..." : "Adicionar"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Forma de pagamento */}
                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Forma de pagamento</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PAGAMENTOS.map(({ valor, label }) => (
                      <button
                        key={valor}
                        onClick={() => setFormaPagamento(valor)}
                        className={`rounded-lg border-2 py-2 text-xs font-semibold transition-colors ${
                          formaPagamento === valor
                            ? "border-slate-800 bg-slate-800 text-white"
                            : "border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={fecharConta}
                  disabled={carregando || pedidoAtivo.items.length === 0}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                >
                  {carregando ? "Fechando..." : "Fechar Conta"}
                </Button>

                <Button
                  onClick={fecharELiberar}
                  disabled={carregando || pedidoAtivo.items.length === 0}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {carregando ? "Processando..." : "Fechar e Liberar Mesa"}
                </Button>

                <button
                  onClick={liberarMesaEmergencia}
                  disabled={carregando}
                  className="w-full rounded-lg border border-amber-300 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-40"
                >
                  Liberar Mesa (emergência)
                </button>

                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={carregando}
                  className="w-full text-xs text-slate-400 hover:text-red-500 disabled:opacity-40 py-1"
                >
                  Cancelar e liberar mesa
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
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
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                onClick={confirmarCancelamento}
                disabled={carregando}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
