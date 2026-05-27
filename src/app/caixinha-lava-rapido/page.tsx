import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CaixinhaClient from "./caixinha-client";

export const dynamic = "force-dynamic";

export default async function CaixinhaLavaRapidoPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!role) redirect("/login");

  const emailOperador = session?.user?.email ?? "sistema";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🚗 Caixinha Lava-Rápido</h1>
          <p className="mt-1 text-sm text-slate-500">Registre consumos e créditos dos parceiros</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Voltar</Link>
      </div>
      <CaixinhaClient emailOperador={emailOperador} isAdmin={role === "ADMIN"} />
    </main>
  );
}
