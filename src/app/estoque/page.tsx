import Link from "next/link";
import { prisma } from "@/services/prisma";
import EstoqueTable from "./estoque-table";

export default async function EstoquePage() {
  const insumos = await prisma.ingredient.findMany({
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>
      </div>
      <EstoqueTable insumos={JSON.parse(JSON.stringify(insumos))} />
    </main>
  );
}
