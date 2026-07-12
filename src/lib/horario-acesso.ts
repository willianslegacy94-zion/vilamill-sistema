const TIMEZONE = "America/Sao_Paulo"

// domingo=0 ... sábado=6 — janelas de acesso liberado (minutos desde 00:00, horário de Brasília)
const JANELAS: Record<number, { inicio: number; fim: number } | null> = {
  0: null, // domingo: sem acesso
  1: { inicio: 5 * 60 + 30, fim: 20 * 60 + 30 }, // segunda
  2: { inicio: 5 * 60 + 30, fim: 20 * 60 + 30 }, // terça
  3: { inicio: 5 * 60 + 30, fim: 20 * 60 + 30 }, // quarta
  4: { inicio: 5 * 60 + 30, fim: 20 * 60 + 30 }, // quinta
  5: { inicio: 5 * 60 + 30, fim: 23 * 60 + 30 }, // sexta
  6: { inicio: 7 * 60 + 30, fim: 18 * 60 + 30 }, // sábado
}

const DIA_SEMANA_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

function statusJanela(data: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data)

  const weekday = partes.find((p) => p.type === "weekday")?.value ?? "Sun"
  const hour = Number(partes.find((p) => p.type === "hour")?.value ?? "0")
  const minute = Number(partes.find((p) => p.type === "minute")?.value ?? "0")

  const diaSemana = DIA_SEMANA_MAP[weekday]
  const janela = JANELAS[diaSemana]
  const minutosAtuais = hour * 60 + minute

  return { janela, minutosAtuais }
}

/**
 * Verifica se o acesso está dentro do horário permitido para perfis operacionais
 * (CAIXA/COZINHA), sempre em horário de Brasília — independente do timezone do servidor.
 */
export function acessoPermitido(data: Date = new Date()): boolean {
  const { janela, minutosAtuais } = statusJanela(data)
  if (!janela) return false
  return minutosAtuais >= janela.inicio && minutosAtuais <= janela.fim
}

/**
 * Minutos restantes até o encerramento do expediente. Retorna null se o acesso
 * já estiver bloqueado (fora da janela) ou não houver expediente hoje.
 */
export function minutosAteExpirar(data: Date = new Date()): number | null {
  const { janela, minutosAtuais } = statusJanela(data)
  if (!janela) return null
  if (minutosAtuais < janela.inicio || minutosAtuais > janela.fim) return null
  return janela.fim - minutosAtuais
}
