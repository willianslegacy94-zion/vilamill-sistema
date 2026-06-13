import { notFound } from "next/navigation";
import { prisma } from "@/services/prisma";
import PrintTrigger from "./print-trigger";

export default async function ComandaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;

  const pedido = await prisma.order.findUnique({
    where: { id },
    include: { table: true, items: { include: { product: true } } },
  });

  if (!pedido) notFound();

  const hora = pedido.createdAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const data = pedido.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 4mm; }
          body { background: white; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
        <div className="mx-auto max-w-xs bg-white p-4 shadow print:shadow-none">
          <PrintTrigger autoPrint={print === "true"} />

          <div className="text-center">
            <p className="text-2xl font-black tracking-widest">COMANDA</p>
            <p className="mt-1 text-4xl font-black">MESA {pedido.table.numero}</p>
            <p className="mt-1 text-xs text-slate-500">{data} — {hora}</p>
          </div>

          <div className="my-3 border-t-2 border-dashed border-slate-400" />

          <ul className="space-y-2">
            {pedido.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  <span className="font-black">{Number(item.quantidade)}x</span>{" "}
                  {item.product.nome}
                </span>
              </li>
            ))}
          </ul>

          <div className="my-3 border-t-2 border-dashed border-slate-400" />
          <p className="text-center text-xs text-slate-400">Villa Mill Tamboré</p>
        </div>
      </div>
    </>
  );
}
