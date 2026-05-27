import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ParceirosClient from "./parceiros-client";

export const dynamic = "force-dynamic";

export default async function ParceirosPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") redirect("/");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Parceiros — Lava-Rápido</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>
      </div>
      <ParceirosClient />
    </main>
  );
}
