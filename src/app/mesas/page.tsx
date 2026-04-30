import Link from "next/link";
import { prisma } from "@/services/prisma";
import MesasGrid from "./mesas-grid";

export default async function MesasPage() {
  const mesas = await prisma.table.findMany({
    orderBy: { numero: "asc" },
    include: {
      orders: {
        where: { paymentStatus: "PENDENTE" },
        include: { items: { include: { product: true } } },
      },
    },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mesas</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>
      </div>
      <MesasGrid mesas={JSON.parse(JSON.stringify(mesas))} />
    </main>
  );
}
