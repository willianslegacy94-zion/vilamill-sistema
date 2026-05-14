import Link from "next/link";
import MesasGrid from "./mesas-grid";

export default function MesasPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mesas</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>
      </div>
      <MesasGrid />
    </main>
  );
}
