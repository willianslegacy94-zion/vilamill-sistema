import Image from "next/image";
import { auth } from "@/auth";
import DashboardStats from "./dashboard-stats";
import HomeModules from "./home-modules";

export const dynamic = "force-dynamic";

const modules = [
  { href: "/mesas",      title: "Mesas",       desc: "Abra mesas, lance pedidos e feche contas com forma de pagamento.", color: "bg-red-600",     symbol: "🪑", adminOnly: false },
  { href: "/produtos",   title: "Cardápio",    desc: "Gerencie produtos, preços, categorias e fichas técnicas.",         color: "bg-yellow-500", symbol: "🥩", adminOnly: false },
  { href: "/estoque",    title: "Estoque",     desc: "Controle insumos, registre entradas e veja alertas de nível mínimo.", color: "bg-emerald-600", symbol: "📦", adminOnly: false },
  { href: "/despesas",   title: "Despesas",    desc: "Registre compras de mercadoria, serviços e outros custos operacionais.", color: "bg-orange-500", symbol: "🧾", adminOnly: true },
  { href: "/financeiro", title: "Financeiro",  desc: "Relatório diário de vendas por forma de pagamento e ticket médio.", color: "bg-blue-600",   symbol: "📊", adminOnly: true },
  { href: "/parceiros",  title: "Parceiros",   desc: "Gerencie saldos, histórico e liquidação dos funcionários externos.", color: "bg-slate-700", symbol: "👥", adminOnly: true },
  { href: "/admin/caixas", title: "Caixas",   desc: "Gerencie os nomes dos caixas disponíveis para abertura de mesa.", color: "bg-teal-600", symbol: "👤", adminOnly: true },
];

export default async function Home() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isTrainee = (session?.user as any)?.isTrainee ?? false;
  const emailOperador = session?.user?.email ?? "sistema";
  const visibleModules = modules.filter((m) => !m.adminOnly || isAdmin || isTrainee);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <Image src="/logo.png" alt="Villa Mill Tamboré" width={100} height={100} className="rounded-full shadow-lg" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Villa Mill Tamboré</h1>
          <p className="mt-1 text-slate-500">Sistema de gestão e PDV</p>
        </div>
      </div>

      <DashboardStats isAdmin={isAdmin} isTrainee={isTrainee} />

      <HomeModules modulos={visibleModules} emailOperador={emailOperador} />
    </main>
  );
}
