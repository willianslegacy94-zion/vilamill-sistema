"use client"

import Image from "next/image"
import { signOut } from "next-auth/react"
import { Clock, LogOut } from "lucide-react"

const ESCALA = [
  { dias: "Segunda a Quinta", horario: "05:30 às 20:30" },
  { dias: "Sexta-feira", horario: "05:30 às 23:30" },
  { dias: "Sábado", horario: "07:30 às 18:30" },
  { dias: "Domingo", horario: "Sem acesso" },
]

export default function BloqueioHorarioPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-800 p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Villa Mill" width={64} height={64} className="rounded-full" />
          <div className="flex flex-col items-center gap-2 text-center">
            <Clock className="h-8 w-8 text-[#F4C430]" />
            <h1 className="text-xl font-bold text-white">Acesso indisponível</h1>
          </div>
        </div>

        <p className="text-center text-sm text-slate-300">
          O expediente está encerrado no momento. Por questões de segurança e conformidade,
          o acesso ao sistema fica disponível apenas durante o horário de funcionamento.
        </p>

        <div className="mt-6 space-y-2 rounded-lg border border-white/10 bg-zinc-900/60 p-4">
          {ESCALA.map((item) => (
            <div key={item.dias} className="flex justify-between text-sm">
              <span className="text-slate-400">{item.dias}</span>
              <span className="font-medium text-white">{item.horario}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-zinc-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-600"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </main>
  )
}
