import Link from "next/link";
import { prisma } from "@/services/prisma";
import { auth } from "@/auth";
import EstoqueTable from "./estoque-table";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN" || role === "CAIXA";
  const isTrainee = (session?.user as any)?.isTrainee ?? false;

  const [insumos, produtos] = await Promise.all([
    prisma.ingredient.findMany({ orderBy: { nome: "asc" } }),
    prisma.product.findMany({
      where: { track_inventory: true },
      orderBy: [{ categoria: "asc" }, { nome: "asc" }],
      select: { id: true, nome: true, categoria: true, estoque: true },
    }),
  ]);

  const categorias = [...new Set(produtos.map((p) => p.categoria))].sort();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>
      </div>
      <EstoqueTable
        insumos={JSON.parse(JSON.stringify(insumos))}
        produtos={JSON.parse(JSON.stringify(produtos))}
        categorias={categorias}
        isAdmin={isAdmin || isTrainee}
      />
    </main>
  );
}
