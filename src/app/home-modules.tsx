"use client";

import { useState } from "react";
import Link from "next/link";
import CaixinhaModal from "@/components/caixinha-modal";

type Modulo = {
  href: string;
  title: string;
  desc: string;
  color: string;
  symbol: string;
};

type Props = {
  modulos: Modulo[];
  emailOperador: string;
};

export default function HomeModules({ modulos, emailOperador }: Props) {
  const [openCaixinha, setOpenCaixinha] = useState(false);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modulos.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${mod.color}`}>
              {mod.symbol}
            </div>
            <h2 className="font-bold text-slate-900 group-hover:text-[#CC1111] transition-colors">{mod.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{mod.desc}</p>
          </Link>
        ))}

        {/* Card especial — abre modal, não navega */}
        <button
          type="button"
          onClick={() => setOpenCaixinha(true)}
          className="group flex flex-col rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md text-left"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl bg-violet-600">
            🚗
          </div>
          <h2 className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">Caixinha Lava-Rápido</h2>
          <p className="mt-1 text-sm text-slate-500">Registre caixinha e consumo dos funcionários parceiros.</p>
        </button>
      </div>

      {openCaixinha && (
        <CaixinhaModal
          emailOperador={emailOperador}
          onClose={() => setOpenCaixinha(false)}
        />
      )}
    </>
  );
}
