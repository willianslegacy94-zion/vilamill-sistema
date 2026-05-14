import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/services/prisma";
import { auth } from "@/auth";
import DespesasTable from "./despesas-table";

export const dynamic = "force-dynamic";

export default async function DespesasPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isTrainee = (session?.user as any)?.isTrainee ?? false;
  if (role !== "ADMIN" && !isTrainee) redirect("/");

  const despesas = await prisma.despesa.findMany({ orderBy: { data: "desc" } });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Despesas</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>
      </div>
      <DespesasTable despesas={JSON.parse(JSON.stringify(despesas))} />
    </main>
  );
}
