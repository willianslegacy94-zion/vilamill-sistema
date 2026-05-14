import Image from "next/image";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { prisma } from "@/services/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function getStats() {
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const inicioDia = new Date(`${hoje}T03:00:00.000Z`);
  const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1);

  const [mesasAbertas, todosInsumos, vendasHoje] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: "PENDENTE" } }),
    prisma.ingredient.findMany({ select: { id: true, nome: true, quantidadeAtual: true, nivelMinimoAlerta: true } }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAGO", closedAt: { gte: inicioDia, lte: fimDia } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const insumoCriticos = todosInsumos.filter(
    (i) => Number(i.quantidadeAtual) <= Number(i.nivelMinimoAlerta)
  );

  return { mesasAbertas, insumoCriticos, vendasHoje };
}

const modules = [
  { href: "/mesas",      title: "Mesas",       desc: "Abra mesas, lance pedidos e feche contas com forma de pagamento.", color: "bg-red-600",     symbol: "🪑", adminOnly: false },
  { href: "/produtos",   title: "Cardápio",    desc: "Gerencie produtos, preços, categorias e fichas técnicas.",         color: "bg-yellow-500", symbol: "🥩", adminOnly: false },
  { href: "/estoque",    title: "Estoque",     desc: "Controle insumos, registre entradas e veja alertas de nível mínimo.", color: "bg-emerald-600", symbol: "📦", adminOnly: false },
  { href: "/despesas",   title: "Despesas",    desc: "Registre compras de mercadoria, serviços e outros custos operacionais.", color: "bg-orange-500", symbol: "🧾", adminOnly: true },
  { href: "/financeiro", title: "Financeiro",  desc: "Relatório diário de vendas por forma de pagamento e ticket médio.", color: "bg-blue-600",   symbol: "📊", adminOnly: true },
];

export default async function Home() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isTrainee = (session?.user as any)?.isTrainee ?? false;
  const { mesasAbertas, insumoCriticos, vendasHoje } = await getStats();
  const visibleModules = modules.filter((m) => !m.adminOnly || isAdmin || isTrainee);

  const faturamento = Number(vendasHoje._sum.total ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      {/* Hero */}
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <Image src="/logo.png" alt="Villa Mill Tamboré" width={100} height={100} className="rounded-full shadow-lg" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Villa Mill Tamboré</h1>
          <p className="mt-1 text-slate-500">Sistema de gestão e PDV</p>
        </div>
      </div>

      {/* Indicadores rápidos */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mesas abertas</p>
          <p className={`mt-1 text-3xl font-bold ${mesasAbertas > 0 ? "text-amber-600" : "text-slate-800"}`}>
            {mesasAbertas}
          </p>
        </div>
        {(isAdmin || isTrainee) && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Faturamento hoje</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{faturamento}</p>
          </div>
        )}
        <div className={`rounded-xl border border-slate-200 bg-white px-5 py-4 ${!isAdmin && !isTrainee ? "col-span-1" : "col-span-2 md:col-span-1"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pedidos fechados</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{vendasHoje._count}</p>
        </div>
      </div>

      {/* Alertas de estoque crítico */}
      {insumoCriticos.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          {insumoCriticos.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-5 py-3">
              <TriangleAlert className="h-5 w-5 shrink-0 text-red-600" />
              <p className="font-semibold text-red-700">ESTOQUE CRÍTICO: {i.nome}</p>
            </div>
          ))}
        </div>
      )}

      {/* Módulos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleModules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${mod.color}`}>
              {mod.symbol}
            </div>
            <h2 className="font-bold text-slate-900 group-hover:text-[#CC1111] transition-colors">{mod.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{mod.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
