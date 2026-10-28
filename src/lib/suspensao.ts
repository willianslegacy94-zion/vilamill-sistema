import { NextResponse } from "next/server"

// Suspensão do sistema (ex.: falta de pagamento) — controlada só por env no `.env` da VPS,
// pra que nenhum usuário (nem ADMIN) consiga desfazer pela interface. Lida em runtime:
// quem chama precisa rodar no runtime Node (o `proxy`/`middleware` com runtime Node).

export function sistemaSuspenso() {
  return process.env.SISTEMA_SUSPENSO === "true"
}

// 404 genérico, sem nome nem marca — pra quem acessa, o sistema simplesmente não existe.
export function respostaSuspenso() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
  })
}
