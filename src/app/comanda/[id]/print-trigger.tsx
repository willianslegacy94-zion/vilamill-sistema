"use client";
import { useEffect } from "react";

export default function PrintTrigger({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (autoPrint) window.print();
  }, [autoPrint]);

  return (
    <button
      onClick={() => window.print()}
      className="print:hidden mb-6 w-full rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700"
    >
      Imprimir
    </button>
  );
}
