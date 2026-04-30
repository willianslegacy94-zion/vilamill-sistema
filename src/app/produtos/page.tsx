import Link from "next/link";
import { prisma } from "@/services/prisma";
import ProdutosTable from "./produtos-table";

export default async function ProdutosPage() {
  const produtos = await prisma.product.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  const categorias = [...new Set(produtos.map((p) => p.categoria))].sort();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cardápio</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>
      </div>
      <ProdutosTable
        produtos={JSON.parse(JSON.stringify(produtos))}
        categorias={categorias}
      />
    </main>
  );
}
