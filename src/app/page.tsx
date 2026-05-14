import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import DashboardStats from "./dashboard-stats";

export const dynamic = "force-dynamic";

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
  const visibleModules = modules.filter((m) => !m.adminOnly || isAdmin || isTrainee);

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

      {/* Stats com atualização automática via SWR */}
      <DashboardStats isAdmin={isAdmin} isTrainee={isTrainee} />

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
