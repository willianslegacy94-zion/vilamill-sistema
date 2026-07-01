"use client";

import { useState } from "react";
import Link from "next/link";
import MesasGrid from "./mesas-grid";
import EquipeGrid from "./equipe-grid";

export default function MesasPage() {
  const [aba, setAba] = useState<"mesas" | "equipe">("mesas");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{aba === "mesas" ? "Mesas" : "Equipe"}</h1>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>
      </div>

      <div className="flex rounded-lg bg-slate-100 p-1 sm:w-fit">
        <button
          onClick={() => setAba("mesas")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
            aba === "mesas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Mesas
        </button>
        <button
          onClick={() => setAba("equipe")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
            aba === "equipe" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Equipe
        </button>
      </div>

      {aba === "mesas" ? <MesasGrid /> : <EquipeGrid />}
    </main>
  );
}
