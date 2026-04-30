"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const STATUS = {
  LIVRE: { label: "Livre", bg: "bg-green-50", border: "border-green-300", badge: "bg-green-100 text-green-800" },
  OCUPADA: { label: "Ocupada", bg: "bg-amber-50", border: "border-amber-300", badge: "bg-amber-100 text-amber-800" },
  CONTA: { label: "Conta", bg: "bg-red-50", border: "border-red-300", badge: "bg-red-100 text-red-800" },
} as const;

function moeda(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MesasGrid({ mesas }: { mesas: MesaComPedido[] }) {
  const router = useRouter();
  const [mesaIdSelecionada, setMesaIdSelecionada] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoAPI[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<"DINHEIRO" | "CARTAO" | "PIX">("DINHEIRO");

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
        body: JSON.stringify({ formaPagamento }),
      })
    ).then(() => setMesaIdSelecionada(null));
  }

  function liberarMesa() {
    if (!pedidoAtivo) return;
    const temItens = pedidoAtivo.items.length > 0;
    const confirmMsg = temItens
      ? `A mesa ${mesaSelecionada!.numero} tem itens lançados. Deseja mesmo cancelar e liberar a mesa?`
      : `Liberar mesa ${mesaSelecionada!.numero}?`;
    if (!confirm(confirmMsg)) return;
    chamarAPI(() =>
      fetch(`/api/pedidos/${pedidoAtivo.id}`, { method: "DELETE" })
    ).then(() => setMesaIdSelecionada(null));
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
            <div className="mb-5 flex items-start justify-between">
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
                            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                          >
                            Remover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-between border-t pt-3 text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>{moeda(pedidoAtivo.total)}</span>
                </div>

                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adicionar item</p>
                  <select
                    value={produtoId}
                    onChange={(e) => setProdutoId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {moeda(p.preco)}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                      className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                    <Button
                      onClick={adicionarItem}
                      disabled={carregando || !produtoId}
                      className="flex-1"
                    >
                      {carregando ? "..." : "Adicionar"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Forma de pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["DINHEIRO", "CARTAO", "PIX"] as const).map((forma) => (
                      <button
                        key={forma}
                        onClick={() => setFormaPagamento(forma)}
                        className={`rounded-lg border-2 py-2 text-xs font-semibold transition-colors ${
                          formaPagamento === forma
                            ? "border-slate-800 bg-slate-800 text-white"
                            : "border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {forma === "DINHEIRO" ? "Dinheiro" : forma === "CARTAO" ? "Cartão" : "Pix"}
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

                <button
                  onClick={liberarMesa}
                  disabled={carregando}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 disabled:opacity-40 py-1"
                >
                  Cancelar e liberar mesa
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
