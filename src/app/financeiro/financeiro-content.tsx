"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DateRangeFilter from "./date-selector";
import { useFinanceiro } from "@/hooks/useAppData";

function toDatetimeLocal(isoStr: string | null): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T").slice(0, 16);
}
function fromDatetimeLocal(localStr: string): string {
  return new Date(localStr + ":00-03:00").toISOString();
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatHora(d: string) {
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}
function formatData(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
function formatDataHora(d: string) {
  return `${formatData(d)} ${formatHora(d)}`;
}
function hojeStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
function primeiroDiaMes() {
  const [y, m] = hojeStr().split("-");
  return `${y}-${m}-01`;
}

type PagEntry = { forma: string; valor: number };
type Item = {
  id: string; productId: string;
  custoUnit: string | number; precoUnit: string | number;
  quantidade: string | number; subtotal: string | number;
  product: { id: string; nome: string; preco: string | number };
};
type Pedido = {
  id: string; total: string | number; desconto: string | number; formaPagamento: string | null;
  pagamentosSplit: PagEntry[] | null; closedAt: string | null; createdAt: string;
  caixaNome: string | null;
  items: Item[]; table: { numero: number };
};
type EditPag = { forma: string; valor: string };
type EditItem = { id: string; productId: string; nome: string; precoUnit: number; custoUnit: number; quantidade: number };
type Produto = { id: string; nome: string; preco: string | number; costPrice: string | number; categoria: string };

const CATEGORIAS_CARDAPIO = [
  "Pratos do Dia", "Todos os Dias", "Acompanhamentos",
  "Lanches Tradicionais", "Lanches na Baguete", "Lanches Artesanais",
  "Porções", "Sucos", "Refrigerantes", "Cervejas", "Sobremesas",
];
type PedidoAberto = {
  id: string; total: string | number; createdAt: string;
  caixaNome: string | null;
  items: Item[]; table: { numero: number };
};
type Cancelamento = {
  id: string; mesaNumero: number; motivoCancelamento: string | null;
  canceladoPor: string; canceladoEm: string;
};
type Despesa = {
  id: string; descricao: string; valor: string | number;
  categoria: string; data: string; registradoPor: string;
};
type CreditoCaixinha = {
  id: string; tipo: "INDIVIDUAL" | "COLETIVO";
  funcionario: { nome: string } | null;
  empresa: string | null; valor: string | number;
  descricao: string | null; registradoPor: string; registradoEm: string;
};
type ConsumoCaixinha = {
  id: string; funcionario: { nome: string };
  product: { nome: string };
  quantidade: string | number; precoUnit: string | number; subtotal: string | number;
  registradoPor: string; registradoEm: string;
  liquidado: boolean; liquidadoEm: string | null;
};
type LancamentoVale = {
  id: string; tipo: "DINHEIRO" | "PRODUTO";
  descricao: string; valor: string | number;
  status: "PENDENTE" | "PAGO"; registradoPor: string; createdAt: string;
  colaborador: { nome: string; setor: string; empresa: string };
};
type EntradaExtrato = {
  id: string; kind: "credito" | "baixa"; data: string;
  destino: string; descricao: string; registradoPor: string; valor: number;
  liquidado?: boolean;
};
type ConfirmDelete = {
  id: string; kind: "transacao" | "credito" | "baixa"; label: string;
};
type EditCaixinha = {
  id: string; kind: "credito" | "baixa"; destino: string;
  valor: number; descricao: string;
  quantidade: number; precoUnit: number;
};

const PAGAMENTOS_OPTIONS = [
  { valor: "DINHEIRO", label: "Dinheiro" },
  { valor: "CREDITO",  label: "Crédito" },
  { valor: "DEBITO",   label: "Débito" },
  { valor: "PIX",      label: "Pix" },
  { valor: "VOUCHER",  label: "Voucher VR/VA" },
];
const pagLabel: Record<string, string> = {
  DINHEIRO: "Dinheiro", CREDITO: "Crédito", DEBITO: "Débito",
  PIX: "Pix", VOUCHER: "Voucher VR/VA", CARTAO: "Cartão",
};
const pagColor: Record<string, string> = {
  DINHEIRO: "bg-green-100 text-green-700",
  CREDITO:  "bg-blue-100 text-blue-700",
  DEBITO:   "bg-indigo-100 text-indigo-700",
  PIX:      "bg-purple-100 text-purple-700",
  VOUCHER:  "bg-amber-100 text-amber-700",
  CARTAO:   "bg-blue-100 text-blue-600",
};

function SectionHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-b border-slate-100 pb-3 mb-5 ${className}`}>
      {children}
    </div>
  );
}

function FinanceiroSkeleton() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-10 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-8 w-32 rounded bg-slate-200" />
        <div className="h-8 w-56 rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 h-3 w-24 rounded bg-slate-200" />
            <div className="h-8 w-28 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </main>
  );
}

export default function FinanceiroContent({ isAdmin }: { isAdmin: boolean }) {
  const params = useSearchParams();
  const fromStr = params.get("from") ?? primeiroDiaMes();
  const toStr   = params.get("to")   ?? hojeStr();

  // ── Estado: edição de transação ──────────────────────────────
  const [editando, setEditando] = useState<Pedido | null>(null);
  const [editTotal, setEditTotal] = useState("");
  const [editDesconto, setEditDesconto] = useState("");
  const [editCaixaNome, setEditCaixaNome] = useState("");
  const [editPagamentos, setEditPagamentos] = useState<EditPag[]>([]);
  const [editCreatedAt, setEditCreatedAt] = useState("");
  const [editClosedAt, setEditClosedAt] = useState("");
  const [caixasDisponiveis, setCaixasDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [editNovoProductId, setEditNovoProductId] = useState("");
  const [editNovaQtd, setEditNovaQtd] = useState(1);
  const [editBusca, setEditBusca] = useState("");
  const [editCategoria, setEditCategoria] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/caixas").then((r) => r.json()).then(setCaixasDisponiveis).catch(() => {});
    fetch("/api/produtos").then((r) => r.json()).then((data: Produto[]) => {
      setProdutos(data);
      if (data.length > 0) setEditNovoProductId(data[0].id);
    }).catch(() => {});
  }, []);

  // ── Estado: exclusão (compartilhado) ─────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);
  const [deletando, setDeletando] = useState(false);

  // ── Estado: edição de caixinha ───────────────────────────────
  const [editCaixinha, setEditCaixinha] = useState<EditCaixinha | null>(null);
  const [editCaixinhaValor, setEditCaixinhaValor] = useState("");
  const [editCaixinhaDescricao, setEditCaixinhaDescricao] = useState("");
  const [editCaixinhaQtd, setEditCaixinhaQtd] = useState("");
  const [salvandoCaixinha, setSalvandoCaixinha] = useState(false);

  const { data, isLoading, isValidating, mutate } = useFinanceiro(fromStr, toStr) as any;

  // ── Edição transação ─────────────────────────────────────────
  function abrirEdicao(p: Pedido) {
    setEditando(p);
    setEditTotal(Number(p.total).toFixed(2));
    setEditDesconto(Number(p.desconto ?? 0).toFixed(2));
    setEditCaixaNome(p.caixaNome ?? "");
    setEditCreatedAt(toDatetimeLocal(p.createdAt));
    setEditClosedAt(toDatetimeLocal(p.closedAt));
    setEditItems(p.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      nome: i.product.nome,
      precoUnit: Number(i.precoUnit),
      custoUnit: Number(i.custoUnit),
      quantidade: Number(i.quantidade),
    })));
    setEditBusca("");
    setEditCategoria(null);
    setEditNovaQtd(1);
    if (p.pagamentosSplit && p.pagamentosSplit.length > 0) {
      setEditPagamentos(p.pagamentosSplit.map((e) => ({ forma: e.forma, valor: String(e.valor) })));
    } else {
      setEditPagamentos([{ forma: p.formaPagamento ?? "DINHEIRO", valor: Number(p.total).toFixed(2) }]);
    }
  }

  function recalcularTotal(items: EditItem[], desconto: string) {
    const sub = items.reduce((s, i) => s + i.precoUnit * i.quantidade, 0);
    return Math.max(0, sub - (Number(desconto) || 0)).toFixed(2);
  }

  function alterarQtdItem(productId: string, novaQtd: number) {
    if (novaQtd <= 0) return;
    setEditItems((prev) => {
      const next = prev.map((i) => i.productId === productId ? { ...i, quantidade: novaQtd } : i);
      setEditTotal(recalcularTotal(next, editDesconto));
      return next;
    });
  }

  function removerEditItem(productId: string) {
    setEditItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      setEditTotal(recalcularTotal(next, editDesconto));
      return next;
    });
  }

  function adicionarEditItem() {
    if (!editNovoProductId) return;
    const produto = produtos.find((p) => p.id === editNovoProductId);
    if (!produto) return;
    setEditItems((prev) => {
      const existente = prev.find((i) => i.productId === editNovoProductId);
      let next: EditItem[];
      if (existente) {
        next = prev.map((i) => i.productId === editNovoProductId
          ? { ...i, quantidade: i.quantidade + editNovaQtd }
          : i);
      } else {
        next = [...prev, {
          id: "",
          productId: produto.id,
          nome: produto.nome,
          precoUnit: Number(produto.preco),
          custoUnit: Number(produto.costPrice),
          quantidade: editNovaQtd,
        }];
      }
      setEditTotal(recalcularTotal(next, editDesconto));
      return next;
    });
    setEditNovaQtd(1);
  }
  function atualizarEditPag(i: number, field: keyof EditPag, value: string) {
    setEditPagamentos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }
  function adicionarEditPag() {
    setEditPagamentos((prev) => {
      const total = Number(editTotal) || 0;
      const pago  = prev.reduce((s, p) => s + (Number(p.valor) || 0), 0);
      const falta = Math.max(0, Math.round((total - pago) * 100) / 100);
      return [...prev, { forma: "DINHEIRO", valor: falta > 0 ? falta.toFixed(2) : "" }];
    });
  }
  function removerEditPag(i: number) {
    setEditPagamentos((prev) => prev.filter((_, idx) => idx !== i));
  }
  async function salvarEdicao() {
    if (!editando) return;
    setSalvando(true);
    try {
      const orderId = editando.id;
      const itemsOriginais = editando.items;

      // 1. Remover itens deletados
      for (const orig of itemsOriginais) {
        if (!editItems.find((i) => i.productId === orig.productId)) {
          await fetch(`/api/pedidos/${orderId}/items/${orig.id}`, { method: "DELETE" });
        }
      }

      // 2. Atualizar qtd ou criar itens novos
      for (const item of editItems) {
        const orig = itemsOriginais.find((i) => i.productId === item.productId);
        if (orig) {
          if (Number(orig.quantidade) !== item.quantidade) {
            await fetch(`/api/pedidos/${orderId}/items/${orig.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quantidade: item.quantidade }),
            });
          }
        } else {
          await fetch(`/api/pedidos/${orderId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: item.productId, quantidade: item.quantidade }),
          });
        }
      }

      // 3. Salvar campos do pedido
      const validos = editPagamentos
        .filter((p) => Number(p.valor) > 0)
        .map((p) => ({ forma: p.forma, valor: Number(p.valor) }));
      const primario = validos.length > 0
        ? validos.reduce((a, b) => (b.valor > a.valor ? b : a))
        : { forma: "DINHEIRO", valor: 0 };

      const res = await fetch(`/api/pedidos/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: Number(editTotal),
          desconto: Number(editDesconto) || 0,
          caixaNome: editCaixaNome || null,
          formaPagamento: primario.forma,
          pagamentosSplit: validos.length > 1 ? validos : null,
          ...(editCreatedAt && { createdAt: fromDatetimeLocal(editCreatedAt) }),
          ...(editClosedAt && { closedAt: fromDatetimeLocal(editClosedAt) }),
        }),
      });
      if (!res.ok) throw new Error();
      mutate();
      setEditando(null);
    } catch {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // ── Exclusão ─────────────────────────────────────────────────
  function pedirConfirmDelete(id: string, kind: ConfirmDelete["kind"], label: string) {
    setConfirmDelete({ id, kind, label });
  }
  async function executarDelete() {
    if (!confirmDelete) return;
    setDeletando(true);
    const { id, kind } = confirmDelete;
    try {
      let url = "";
      if (kind === "transacao")  url = `/api/pedidos/${id}`;
      if (kind === "credito")    url = `/api/parceiros/credito/${id}`;
      if (kind === "baixa")      url = `/api/parceiros/consumo/${id}`;
      const res = await fetch(url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error();
      mutate();
      setConfirmDelete(null);
    } catch {
      alert("Erro ao excluir. Tente novamente.");
    } finally {
      setDeletando(false);
    }
  }

  // ── Baixa (liquidação) de consumo ─────────────────────────────
  const [liquidando, setLiquidando] = useState<string | null>(null);
  async function marcarLiquidado(id: string) {
    setLiquidando(id);
    try {
      const res = await fetch(`/api/parceiros/consumo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liquidado: true }),
      });
      if (!res.ok) throw new Error();
      mutate();
    } catch {
      alert("Erro ao dar baixa. Tente novamente.");
    } finally {
      setLiquidando(null);
    }
  }

  // ── Edição caixinha ──────────────────────────────────────────
  function abrirEdicaoCaixinha(entrada: EntradaExtrato, creditos: CreditoCaixinha[], consumos: ConsumoCaixinha[]) {
    if (entrada.kind === "credito") {
      const original = creditos.find((c) => c.id === entrada.id)!;
      setEditCaixinha({
        id: entrada.id, kind: "credito", destino: entrada.destino,
        valor: Number(original.valor), descricao: original.descricao ?? "",
        quantidade: 0, precoUnit: 0,
      });
      setEditCaixinhaValor(Number(original.valor).toFixed(2));
      setEditCaixinhaDescricao(original.descricao ?? "");
    } else {
      const original = consumos.find((c) => c.id === entrada.id)!;
      setEditCaixinha({
        id: entrada.id, kind: "baixa", destino: entrada.destino,
        valor: Number(original.subtotal), descricao: entrada.descricao,
        quantidade: Number(original.quantidade), precoUnit: Number(original.precoUnit),
      });
      setEditCaixinhaQtd(Number(original.quantidade).toString());
    }
  }
  async function salvarEdicaoCaixinha() {
    if (!editCaixinha) return;
    setSalvandoCaixinha(true);
    try {
      let url = "", body = {};
      if (editCaixinha.kind === "credito") {
        url = `/api/parceiros/credito/${editCaixinha.id}`;
        body = { valor: Number(editCaixinhaValor), descricao: editCaixinhaDescricao || null };
      } else {
        url = `/api/parceiros/consumo/${editCaixinha.id}`;
        body = { quantidade: Number(editCaixinhaQtd) };
      }
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      mutate();
      setEditCaixinha(null);
    } catch {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvandoCaixinha(false);
    }
  }

  const produtosFiltrados = useMemo(() => {
    const q = editBusca.toLowerCase();
    return produtos.filter((p) => {
      const matchBusca = !q || p.nome.toLowerCase().includes(q);
      const matchCat = !editCategoria || p.categoria === editCategoria;
      return matchBusca && matchCat;
    });
  }, [produtos, editBusca, editCategoria]);

  const produtoSelecionado = produtos.find((p) => p.id === editNovoProductId) ?? null;

  if (isLoading && !data) return <FinanceiroSkeleton />;

  const pedidosFechados: Pedido[]            = data?.pedidosFechados     ?? [];
  const pedidosAbertos: PedidoAberto[]       = data?.pedidosAbertos      ?? [];
  const cancelamentos: Cancelamento[]        = data?.cancelamentos       ?? [];
  const despesas: Despesa[]                  = data?.despesas            ?? [];
  const creditosCaixinha: CreditoCaixinha[]  = data?.creditosCaixinha    ?? [];
  const consumosCaixinha: ConsumoCaixinha[]  = data?.consumosCaixinha    ?? [];
  const lancamentosVales: LancamentoVale[]   = data?.lancamentosVales    ?? [];

  // KPIs
  const receitaBruta  = pedidosFechados.reduce((s, p) => s + Number(p.total), 0);
  const cmv           = pedidosFechados.reduce((s, p) => s + p.items.reduce((si, i) => si + Number(i.custoUnit) * Number(i.quantidade), 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const resultado     = receitaBruta - cmv - totalDespesas;
  const ticketMedio   = pedidosFechados.length > 0 ? receitaBruta / pedidosFechados.length : 0;

  const todasEntradas: PagEntry[] = pedidosFechados.flatMap((p) => {
    if (p.pagamentosSplit && p.pagamentosSplit.length > 0) return p.pagamentosSplit;
    return [{ forma: p.formaPagamento ?? "DINHEIRO", valor: Number(p.total) }];
  });
  const somaForma = (forma: string) =>
    todasEntradas.filter((e) => e.forma === forma).reduce((s, e) => s + e.valor, 0);
  const porForma = {
    DINHEIRO: somaForma("DINHEIRO"),
    CREDITO:  somaForma("CREDITO"),
    DEBITO:   somaForma("DEBITO"),
    PIX:      somaForma("PIX"),
    VOUCHER:  somaForma("VOUCHER"),
    CARTAO:   somaForma("CARTAO"),
  };

  // Caixinha — extrato unificado
  const extratoCaixinha: EntradaExtrato[] = [
    ...creditosCaixinha.map((c) => ({
      id: c.id, kind: "credito" as const, data: c.registradoEm,
      destino: c.tipo === "INDIVIDUAL" && c.funcionario
        ? c.funcionario.nome
        : `Coletivo — ${c.empresa ?? "Lava-Rápido"}`,
      descricao: c.descricao || "—",
      registradoPor: c.registradoPor,
      valor: Number(c.valor),
    })),
    ...consumosCaixinha.map((c) => ({
      id: c.id, kind: "baixa" as const, data: c.registradoEm,
      destino: c.funcionario.nome,
      descricao: `${Number(c.quantidade) % 1 === 0 ? Number(c.quantidade).toFixed(0) : Number(c.quantidade).toFixed(1)}× ${c.product.nome}`,
      registradoPor: c.registradoPor,
      valor: Number(c.subtotal),
      liquidado: c.liquidado,
    })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const totalCreditosCaixinha = creditosCaixinha.reduce((s, c) => s + Number(c.valor), 0);
  const totalBaixasCaixinha   = consumosCaixinha.reduce((s, c) => s + Number(c.subtotal), 0);
  const saldoCaixinha         = totalCreditosCaixinha - totalBaixasCaixinha;
  const temCaixinha           = extratoCaixinha.length > 0;

  // Vales — totais do período
  const totalValesDinheiro = lancamentosVales
    .filter((v) => v.tipo === "DINHEIRO")
    .reduce((s, v) => s + Number(v.valor), 0);
  const totalValesProduto = lancamentosVales
    .filter((v) => v.tipo === "PRODUTO")
    .reduce((s, v) => s + Number(v.valor), 0);
  const totalValesAcumulado = totalValesDinheiro + totalValesProduto;
  const temVales = lancamentosVales.length > 0;

  // Vales — resumo por colaborador
  type ResumoColaborador = { nome: string; setor: string; dinheiro: number; produto: number };
  const resumoValesMap = new Map<string, ResumoColaborador>();
  for (const v of lancamentosVales) {
    const entry = resumoValesMap.get(v.colaborador.nome) ?? {
      nome: v.colaborador.nome, setor: v.colaborador.setor, dinheiro: 0, produto: 0,
    };
    if (v.tipo === "DINHEIRO") entry.dinheiro += Number(v.valor);
    else entry.produto += Number(v.valor);
    resumoValesMap.set(v.colaborador.nome, entry);
  }
  const resumoValesColabs = Array.from(resumoValesMap.values())
    .sort((a, b) => (b.dinheiro + b.produto) - (a.dinheiro + a.produto));

  const labelPeriodo =
    fromStr === toStr
      ? formatData(`${fromStr}T12:00:00`)
      : `${formatData(`${fromStr}T12:00:00`)} → ${formatData(`${toStr}T12:00:00`)}`;

  // Preview subtotal na edição de baixa
  const previewSubtotalBaixa = editCaixinha?.kind === "baixa"
    ? Number((editCaixinha.precoUnit * (Number(editCaixinhaQtd) || 0)).toFixed(2))
    : 0;

  return (
  <>
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-10">

      {/* ── Cabeçalho ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financeiro</h1>
          <span
            className={`h-2 w-2 rounded-full bg-emerald-400 transition-opacity duration-500 ${isValidating ? "opacity-100" : "opacity-0"}`}
            title="Sincronizando..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Suspense>
            <DateRangeFilter from={fromStr} to={toStr} />
          </Suspense>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Voltar
          </Link>
        </div>
      </div>

      {/* ── Bloco de resumo ───────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardDescription className="text-green-700 text-xs font-semibold uppercase tracking-wide">Receita Bruta</CardDescription>
              <CardTitle className="text-2xl text-green-800 mt-1">{moeda(receitaBruta)}</CardTitle>
              <p className="text-xs text-green-600 mt-1">Total recebido no período</p>
            </CardHeader>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardDescription className="text-red-700 text-xs font-semibold uppercase tracking-wide">CMV</CardDescription>
              <CardTitle className="text-2xl text-red-800 mt-1">{moeda(cmv)}</CardTitle>
              <p className="text-xs text-red-600 mt-1">Custo dos itens vendidos</p>
            </CardHeader>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardDescription className="text-orange-700 text-xs font-semibold uppercase tracking-wide">Despesas</CardDescription>
              <CardTitle className="text-2xl text-orange-800 mt-1">{moeda(totalDespesas)}</CardTitle>
              <p className="text-xs text-orange-600 mt-1">{despesas.length} lançamento{despesas.length !== 1 ? "s" : ""} no período</p>
            </CardHeader>
          </Card>
          <Card className={resultado >= 0 ? "border-blue-200 bg-blue-50" : "border-red-300 bg-red-50"}>
            <CardHeader>
              <CardDescription className={`text-xs font-semibold uppercase tracking-wide ${resultado >= 0 ? "text-blue-700" : "text-red-700"}`}>Resultado</CardDescription>
              <CardTitle className={`text-2xl mt-1 ${resultado >= 0 ? "text-blue-800" : "text-red-800"}`}>{moeda(resultado)}</CardTitle>
              <p className={`text-xs mt-1 ${resultado >= 0 ? "text-blue-600" : "text-red-600"}`}>
                Bruto − CMV − Despesas
                {receitaBruta > 0 && (
                  <span className="ml-1 font-semibold">({((resultado / receitaBruta) * 100).toFixed(1)}%)</span>
                )}
              </p>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-semibold uppercase tracking-wide">Pedidos fechados</CardDescription>
              <CardTitle className="text-2xl mt-1">{pedidosFechados.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-semibold uppercase tracking-wide">Ticket médio</CardDescription>
              <CardTitle className="text-2xl mt-1">{moeda(ticketMedio)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-semibold uppercase tracking-wide">Mesas abertas agora</CardDescription>
              <CardTitle className="text-2xl mt-1 text-amber-600">{pedidosAbertos.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Receita por forma de pagamento</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(["DINHEIRO", "CREDITO", "DEBITO", "PIX", "VOUCHER"] as const).map((forma) => (
              <div key={forma} className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{pagLabel[forma]}</span>
                <span className={`text-lg font-bold ${porForma[forma] > 0 ? "text-slate-900" : "text-slate-300"}`}>
                  {moeda(porForma[forma])}
                </span>
              </div>
            ))}
          </div>
          {porForma.CARTAO > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
              <span className="text-sm text-slate-500">Cartão (legado)</span>
              <span className="text-base font-bold text-slate-700">{moeda(porForma.CARTAO)}</span>
            </div>
          )}
        </div>

        {/* Alerta de adiantamentos em dinheiro */}
        {totalValesDinheiro > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">!</span>
              <span className="text-sm font-medium text-amber-800">
                Adiantamentos em dinheiro saíram fisicamente do caixa neste período
              </span>
            </div>
            <span className="text-base font-bold text-amber-700 whitespace-nowrap ml-4">{moeda(totalValesDinheiro)}</span>
          </div>
        )}
      </div>

      {/* ── Transações ────────────────────────────────────────── */}
      <section className="border-t border-slate-100 pt-6">
        <SectionHeader>
          <h2 className="text-base font-bold text-slate-800">
            Transações
            <span className="ml-2 text-sm font-normal text-slate-400">— {labelPeriodo}</span>
          </h2>
        </SectionHeader>
        {pedidosFechados.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma venda registrada neste período.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 text-left">Mesa</th>
                  <th className="px-5 py-3.5 text-left">Data / Hora</th>
                  <th className="px-5 py-3.5 text-left">Caixa</th>
                  <th className="px-5 py-3.5 text-left">Pagamento</th>
                  <th className="px-5 py-3.5 text-right">CMV</th>
                  <th className="px-5 py-3.5 text-right">Total</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosFechados.map((p) => {
                  const cmvPedido = p.items.reduce((s, i) => s + Number(i.custoUnit) * Number(i.quantidade), 0);
                  return (
                    <tr key={p.id} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">Mesa {p.table.numero}</td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {p.closedAt ? formatDataHora(p.closedAt) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {p.caixaNome ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.pagamentosSplit && p.pagamentosSplit.length > 1 ? (
                          <div className="flex flex-col gap-1">
                            {p.pagamentosSplit.map((e, i) => (
                              <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${pagColor[e.forma] ?? "bg-slate-100 text-slate-500"}`}>
                                  {pagLabel[e.forma] ?? e.forma}
                                </span>
                                <span className="text-xs text-slate-400">{moeda(e.valor)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${pagColor[p.formaPagamento ?? ""] ?? "bg-slate-100 text-slate-500"}`}>
                            {pagLabel[p.formaPagamento ?? ""] ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-red-600">{moeda(cmvPedido)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-green-700">{moeda(Number(p.total))}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => abrirEdicao(p)}
                            className="text-xs font-medium text-blue-500 hover:text-blue-700"
                          >
                            Editar
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => pedirConfirmDelete(
                                p.id, "transacao",
                                `Mesa ${p.table.numero} — ${p.closedAt ? formatDataHora(p.closedAt) : "—"} — ${moeda(Number(p.total))}`
                              )}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Excluir transação"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-5 py-3.5 text-sm font-bold text-slate-700">Total do período</td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-red-700">{moeda(cmv)}</td>
                  <td className="px-5 py-3.5 text-right text-base font-bold text-green-700">{moeda(receitaBruta)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ── Mesas em aberto ───────────────────────────────────── */}
      <section className="border-t border-slate-100 pt-6">
        <SectionHeader>
          <h2 className="text-base font-bold text-slate-800">
            Mesas em Aberto
            {pedidosAbertos.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {pedidosAbertos.length}
              </span>
            )}
          </h2>
        </SectionHeader>
        {pedidosAbertos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma mesa aberta no momento.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 text-left">Mesa</th>
                  <th className="px-5 py-3.5 text-left">Abertura</th>
                  <th className="px-5 py-3.5 text-left">Caixa</th>
                  <th className="px-5 py-3.5 text-left">Itens</th>
                  <th className="px-5 py-3.5 text-right">Total parcial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosAbertos.map((p) => (
                  <tr key={p.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">Mesa {p.table.numero}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatHora(p.createdAt)}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">{p.caixaNome ?? "—"}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {p.items.map((i) => `${Number(i.quantidade)}× ${i.product.nome}`).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-amber-700">{moeda(Number(p.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Despesas ──────────────────────────────────────────── */}
      {despesas.length > 0 && (
        <section className="border-t border-slate-100 pt-6">
          <SectionHeader>
            <h2 className="text-base font-bold text-orange-700">
              Despesas
              <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                {despesas.length}
              </span>
            </h2>
          </SectionHeader>
          <div className="overflow-x-auto rounded-xl border border-orange-200">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-orange-50 text-xs font-semibold uppercase tracking-wide text-orange-500">
                <tr>
                  <th className="px-5 py-3.5 text-left">Data</th>
                  <th className="px-5 py-3.5 text-left">Descrição</th>
                  <th className="px-5 py-3.5 text-left">Categoria</th>
                  <th className="px-5 py-3.5 text-left">Registrado por</th>
                  <th className="px-5 py-3.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {despesas.map((d) => (
                  <tr key={d.id} className="bg-white hover:bg-orange-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500">{formatData(d.data)}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{d.descricao}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        {d.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{d.registradoPor}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-orange-700">{moeda(Number(d.valor))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-orange-200 bg-orange-50">
                <tr>
                  <td colSpan={4} className="px-5 py-3.5 text-sm font-bold text-orange-700">Total de despesas</td>
                  <td className="px-5 py-3.5 text-right text-base font-bold text-orange-700">{moeda(totalDespesas)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* ── Cancelamentos ─────────────────────────────────────── */}
      {cancelamentos.length > 0 && (
        <section className="border-t border-slate-100 pt-6">
          <SectionHeader>
            <h2 className="text-base font-bold text-red-700">
              Cancelamentos
              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                {cancelamentos.length}
              </span>
            </h2>
          </SectionHeader>
          <div className="overflow-x-auto rounded-xl border border-red-200">
            <table className="w-full min-w-[380px] text-sm">
              <thead className="bg-red-50 text-xs font-semibold uppercase tracking-wide text-red-500">
                <tr>
                  <th className="px-5 py-3.5 text-left">Hora</th>
                  <th className="px-5 py-3.5 text-left">Mesa</th>
                  <th className="px-5 py-3.5 text-left">Motivo</th>
                  <th className="px-5 py-3.5 text-left">Cancelado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {cancelamentos.map((c) => (
                  <tr key={c.id} className="bg-white hover:bg-red-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500">{formatHora(c.canceladoEm)}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">Mesa {c.mesaNumero}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.motivoCancelamento || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{c.canceladoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Vales e Adiantamentos ─────────────────────────────── */}
      {temVales && (
        <section className="border-t border-slate-100 pt-6">
          <SectionHeader>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-bold text-amber-700">
                Resumo de Vales e Adiantamentos do Período
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
                  {lancamentosVales.length}
                </span>
              </h2>
              <span className="text-sm text-slate-400">{labelPeriodo}</span>
            </div>
          </SectionHeader>

          {/* Sub-cards de totais */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Total Adiantamentos (Dinheiro)</span>
              <span className="text-xl font-bold text-amber-700">{moeda(totalValesDinheiro)}</span>
              <span className="text-xs text-amber-500">
                {lancamentosVales.filter((v) => v.tipo === "DINHEIRO").length} lançamento{lancamentosVales.filter((v) => v.tipo === "DINHEIRO").length !== 1 ? "s" : ""} em espécie
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-600">Total Consumo (Produtos)</span>
              <span className="text-xl font-bold text-sky-700">{moeda(totalValesProduto)}</span>
              <span className="text-xs text-sky-500">
                {lancamentosVales.filter((v) => v.tipo === "PRODUTO").length} lançamento{lancamentosVales.filter((v) => v.tipo === "PRODUTO").length !== 1 ? "s" : ""} em cardápio
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-slate-300 bg-slate-50 px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Acumulado</span>
              <span className="text-xl font-bold text-slate-700">{moeda(totalValesAcumulado)}</span>
              <span className="text-xs text-slate-400">Dinheiro + Produtos no período</span>
            </div>
          </div>

          {/* Tabela de totais por colaborador */}
          <div className="overflow-x-auto rounded-xl border border-amber-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-amber-50 text-xs font-semibold uppercase tracking-wide text-amber-500">
                <tr>
                  <th className="px-5 py-3.5 text-left">Colaborador</th>
                  <th className="px-5 py-3.5 text-left">Setor</th>
                  <th className="px-5 py-3.5 text-right">Total em Dinheiro (R$)</th>
                  <th className="px-5 py-3.5 text-right">Total em Produtos (R$)</th>
                  <th className="px-5 py-3.5 text-right">Subtotal Retido (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {resumoValesColabs.map((colab) => {
                  const subtotal = colab.dinheiro + colab.produto;
                  return (
                    <tr key={colab.nome} className="bg-white hover:bg-amber-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{colab.nome}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {colab.setor}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-amber-700">
                        {colab.dinheiro > 0 ? moeda(colab.dinheiro) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-sky-700">
                        {colab.produto > 0 ? moeda(colab.produto) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-800">{moeda(subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-amber-200 bg-amber-50">
                <tr>
                  <td colSpan={2} className="px-5 py-3.5 text-sm font-bold text-amber-700">Total do período</td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-amber-700">{moeda(totalValesDinheiro)}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-sky-700">{moeda(totalValesProduto)}</td>
                  <td className="px-5 py-3.5 text-right text-base font-bold text-slate-800">{moeda(totalValesAcumulado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* ── Caixinha — Lava-Rápido ────────────────────────────── */}
      {temCaixinha && (
        <section className="border-t border-slate-100 pt-6">
          <SectionHeader>
            <h2 className="text-base font-bold text-violet-700">
              Caixinha — Lava-Rápido
              <span className="ml-2 text-sm font-normal text-slate-400">— {labelPeriodo}</span>
            </h2>
          </SectionHeader>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Total Créditos</span>
              <span className="text-xl font-bold text-emerald-700">{moeda(totalCreditosCaixinha)}</span>
              <span className="text-xs text-emerald-500">{creditosCaixinha.length} lançamento{creditosCaixinha.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-red-600">Total Baixas</span>
              <span className="text-xl font-bold text-red-700">{moeda(totalBaixasCaixinha)}</span>
              <span className="text-xs text-red-500">{consumosCaixinha.length} consumo{consumosCaixinha.length !== 1 ? "s" : ""}</span>
            </div>
            <div className={`flex flex-col gap-1 rounded-xl border px-5 py-4 ${saldoCaixinha >= 0 ? "border-violet-200 bg-violet-50" : "border-red-200 bg-red-50"}`}>
              <span className={`text-xs font-semibold uppercase tracking-wide ${saldoCaixinha >= 0 ? "text-violet-600" : "text-red-600"}`}>Saldo do Período</span>
              <span className={`text-xl font-bold ${saldoCaixinha >= 0 ? "text-violet-700" : "text-red-700"}`}>{moeda(saldoCaixinha)}</span>
              <span className={`text-xs ${saldoCaixinha >= 0 ? "text-violet-400" : "text-red-400"}`}>Créditos − Baixas</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-violet-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-violet-50 text-xs font-semibold uppercase tracking-wide text-violet-500">
                <tr>
                  <th className="px-5 py-3.5 text-left">Data / Hora</th>
                  <th className="px-5 py-3.5 text-left">Tipo</th>
                  <th className="px-5 py-3.5 text-left">Funcionário / Destino</th>
                  <th className="px-5 py-3.5 text-left">Descrição</th>
                  <th className="px-5 py-3.5 text-left">Registrado por</th>
                  <th className="px-5 py-3.5 text-right">Valor</th>
                  {isAdmin && <th className="px-5 py-3.5"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100">
                {extratoCaixinha.map((e) => (
                  <tr key={e.id} className="bg-white hover:bg-violet-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDataHora(e.data)}</td>
                    <td className="px-5 py-3.5">
                      {e.kind === "credito" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <span>+</span> Crédito
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          <span>−</span> Baixa
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{e.destino}</td>
                    <td className="px-5 py-3.5 text-slate-500">{e.descricao}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{e.registradoPor}</td>
                    <td className={`px-5 py-3.5 text-right font-semibold whitespace-nowrap ${e.kind === "credito" ? "text-emerald-700" : "text-red-700"}`}>
                      {e.kind === "credito" ? "+" : "−"}{moeda(e.valor)}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {e.kind === "baixa" && (
                            e.liquidado ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                Pago
                              </span>
                            ) : (
                              <button
                                onClick={() => marcarLiquidado(e.id)}
                                disabled={liquidando === e.id}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-40"
                                title="Marcar consumo como pago"
                              >
                                {liquidando === e.id ? "Salvando..." : "Dar baixa"}
                              </button>
                            )
                          )}
                          <button
                            onClick={() => abrirEdicaoCaixinha(e, creditosCaixinha, consumosCaixinha)}
                            className="text-xs font-medium text-blue-500 hover:text-blue-700"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => pedirConfirmDelete(
                              e.id,
                              e.kind === "credito" ? "credito" : "baixa",
                              `${e.kind === "credito" ? "Crédito" : "Baixa"} — ${e.destino} — ${moeda(e.valor)}`
                            )}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Excluir registro"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-violet-200 bg-violet-50">
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-5 py-3.5 text-sm font-bold text-violet-700">
                    Saldo do período
                  </td>
                  <td className={`px-5 py-3.5 text-right text-base font-bold ${saldoCaixinha >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {moeda(saldoCaixinha)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

    </main>

    {/* ── Modal: edição de transação ────────────────────────── */}
    {editando && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
          {/* Cabeçalho fixo */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Editar Transação</h3>
            <p className="mt-0.5 text-sm text-slate-500">Mesa {editando.table.numero}</p>
          </div>

          {/* Corpo com scroll */}
          <div className="overflow-y-auto px-6 py-4 space-y-4">

            {/* Datas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Abertura</label>
                <input
                  type="datetime-local" value={editCreatedAt}
                  onChange={(e) => setEditCreatedAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Fechamento</label>
                <input
                  type="datetime-local" value={editClosedAt}
                  onChange={(e) => setEditClosedAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Caixa */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Caixa</label>
              <select
                value={editCaixaNome}
                onChange={(e) => setEditCaixaNome(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">— Sem caixa —</option>
                {caixasDisponiveis.map((c) => (
                  <option key={c.id} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Total e Desconto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Total (R$)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                  <input
                    type="number" min={0} step={0.01} value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Desconto (R$)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                  <input
                    type="number" min={0} step={0.01} value={editDesconto}
                    onChange={(e) => setEditDesconto(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Pagamentos */}
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pagamento</p>
              {editPagamentos.map((pag, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={pag.forma}
                    onChange={(e) => atualizarEditPag(i, "forma", e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {PAGAMENTOS_OPTIONS.map(({ valor, label }) => (
                      <option key={valor} value={valor}>{label}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                    <input
                      type="number" min={0} step={0.01} value={pag.valor}
                      onChange={(e) => atualizarEditPag(i, "valor", e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  {editPagamentos.length > 1 && (
                    <button onClick={() => removerEditPag(i)} className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500">×</button>
                  )}
                </div>
              ))}
              {(() => {
                const total    = Number(editTotal) || 0;
                const pago     = editPagamentos.reduce((s, p) => s + (Number(p.valor) || 0), 0);
                const restante = Math.round((total - pago) * 100) / 100;
                return (
                  <>
                    <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${Math.abs(restante) < 0.01 ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-600"}`}>
                      <span>Restante</span>
                      <span>{restante.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                    {restante > 0.005 && (
                      <button onClick={adicionarEditPag} className="w-full rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-500 hover:text-slate-700 transition-colors">
                        + Adicionar forma de pagamento
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Itens editáveis */}
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Itens do pedido</p>

              {editItems.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Nenhum item.</p>
              )}

              {editItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-xs text-slate-700">{item.nome}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{moeda(item.precoUnit)}</span>
                  <input
                    type="number" min={1} value={item.quantidade}
                    onChange={(e) => alterarQtdItem(item.productId, Math.max(1, Number(e.target.value)))}
                    className="w-14 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <span className="w-16 text-right text-xs font-semibold text-slate-700">
                    {moeda(item.precoUnit * item.quantidade)}
                  </span>
                  <button
                    onClick={() => removerEditItem(item.productId)}
                    className="shrink-0 text-red-400 hover:text-red-600 text-sm px-1"
                    title="Remover item"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Adicionar item — busca + categorias + lista */}
              <div className="border-t border-slate-100 pt-3 mt-1 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Adicionar item</p>

                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={editBusca}
                  onChange={(e) => { setEditBusca(e.target.value); setEditCategoria(null); }}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                />

                {/* Categorias */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    onClick={() => { setEditCategoria(null); setEditBusca(""); }}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      !editCategoria && !editBusca ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-600 hover:border-slate-500"
                    }`}
                  >
                    Todos
                  </button>
                  {CATEGORIAS_CARDAPIO.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setEditCategoria(cat); setEditBusca(""); }}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                        editCategoria === cat ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Lista de produtos */}
                <div className="max-h-36 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
                  {produtosFiltrados.length === 0 ? (
                    <p className="px-3 py-3 text-center text-xs text-slate-400">Nenhum produto encontrado.</p>
                  ) : (
                    produtosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setEditNovoProductId(p.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 active:bg-slate-100 ${
                          editNovoProductId === p.id ? "bg-slate-100 font-semibold" : ""
                        }`}
                      >
                        <span className="text-slate-800 truncate pr-2">{p.nome}</span>
                        <span className="shrink-0 text-slate-500">{moeda(Number(p.preco))}</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Produto selecionado + qty + botão */}
                {produtoSelecionado && (
                  <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2">
                    <span className="flex-1 truncate text-xs font-medium text-slate-700">
                      {produtoSelecionado.nome}
                    </span>
                    <input
                      type="number" min={1} value={editNovaQtd}
                      onChange={(e) => setEditNovaQtd(Math.max(1, Number(e.target.value)))}
                      className="w-14 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <button
                      onClick={adicionarEditItem}
                      className="shrink-0 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
                    >
                      + Adicionar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé fixo */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
            <button onClick={() => setEditando(null)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={salvarEdicao} disabled={salvando} className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal: edição de caixinha ─────────────────────────── */}
    {editCaixinha && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <h3 className="mb-1 text-lg font-bold text-slate-900">
            {editCaixinha.kind === "credito" ? "Editar Crédito" : "Editar Baixa"}
          </h3>
          <p className="mb-4 text-sm text-slate-500">{editCaixinha.destino}</p>

          {editCaixinha.kind === "credito" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Valor (R$)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                  <input
                    type="number" min={0} step={0.01} value={editCaixinhaValor}
                    onChange={(e) => setEditCaixinhaValor(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Descrição (opcional)</label>
                <input
                  type="text" value={editCaixinhaDescricao}
                  onChange={(e) => setEditCaixinhaDescricao(e.target.value)}
                  placeholder="Ex: Caixinha semana 22"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Quantidade</label>
                <input
                  type="number" min={0.001} step={0.001} value={editCaixinhaQtd}
                  onChange={(e) => setEditCaixinhaQtd(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold ${previewSubtotalBaixa > 0 ? "bg-violet-50 text-violet-700" : "bg-slate-50 text-slate-500"}`}>
                <span>Subtotal</span>
                <span>{moeda(previewSubtotalBaixa)}</span>
              </div>
              <p className="text-xs text-slate-400">
                Preço unitário: {moeda(editCaixinha.precoUnit)} — o subtotal é recalculado automaticamente.
              </p>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button onClick={() => setEditCaixinha(null)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button
              onClick={salvarEdicaoCaixinha}
              disabled={salvandoCaixinha || (editCaixinha.kind === "credito" ? !editCaixinhaValor || Number(editCaixinhaValor) <= 0 : !editCaixinhaQtd || Number(editCaixinhaQtd) <= 0)}
              className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {salvandoCaixinha ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal: confirmar exclusão ─────────────────────────── */}
    {confirmDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <h3 className="mb-1 text-lg font-bold text-slate-900">Excluir registro?</h3>
          <p className="mb-1 text-sm text-slate-700 font-medium">{confirmDelete.label}</p>
          <p className="mb-5 text-sm text-slate-400">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button
              onClick={executarDelete}
              disabled={deletando}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deletando ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
