"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { AlarmClock } from "lucide-react"
import { minutosAteExpirar } from "@/lib/horario-acesso"

const LIMITE_AVISO_MIN = 15
const INTERVALO_CHECAGEM_MS = 30_000

export default function AvisoExpiracaoHorario() {
  const { data: session } = useSession()
  const [minutosRestantes, setMinutosRestantes] = useState<number | null>(null)
  const [dispensado, setDispensado] = useState(false)

  const role = (session?.user as any)?.role
  const isTrainee = (session?.user as any)?.isTrainee
  const ativo = (role === "CAIXA" || role === "COZINHA") && !isTrainee

  useEffect(() => {
    if (!ativo) return

    function checar() {
      const restantes = minutosAteExpirar()
      setMinutosRestantes(restantes)
      // fora da janela de aviso (ex: virou o dia, novo expediente) — rearma o aviso
      if (restantes === null || restantes > LIMITE_AVISO_MIN) {
        setDispensado(false)
      }
    }

    checar()
    const id = setInterval(checar, INTERVALO_CHECAGEM_MS)
    return () => clearInterval(id)
  }, [ativo])

  if (!ativo) return null
  if (minutosRestantes === null || minutosRestantes > LIMITE_AVISO_MIN) return null
  if (dispensado) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
        <div className="flex flex-col items-center gap-3 px-6 pt-6 text-center">
          <AlarmClock className="h-8 w-8 text-[#F4C430]" />
          <h2 className="text-lg font-semibold text-white">Expediente encerrando</h2>
          <p className="text-sm text-slate-300">
            Faltam <span className="font-semibold text-white">{minutosRestantes} min</span> para o
            fim do horário de acesso. Finalize suas operações em andamento.
          </p>
        </div>
        <div className="px-6 pb-6 pt-5">
          <button
            onClick={() => setDispensado(true)}
            className="w-full rounded-md bg-[#F4C430] px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-[#e0b52a]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
