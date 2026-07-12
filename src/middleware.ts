import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { acessoPermitido } from "@/lib/horario-acesso"

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const user = req.auth.user as any
  const role = user?.role
  const isTrainee = user?.isTrainee
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith("/api/")
  const method = req.method

  // Usuário de treinamento: intercepta toda requisição mutante e retorna sucesso falso
  if (isTrainee && isApi && method !== "GET") {
    return NextResponse.json({ ok: true, _treinamento: true })
  }

  // Página de bloqueio: sempre acessível para quem já está autenticado — precisa escapar
  // das restrições de página por role abaixo, senão elas mandam de volta e criam loop
  // com o BYOD Guard (/bloqueio-horario -> /mesas -> BYOD Guard -> /bloqueio-horario -> ...)
  if (pathname === "/bloqueio-horario") {
    return NextResponse.next()
  }

  // BYOD Guard: bloqueia acesso de CAIXA/COZINHA fora do horário de expediente (perfis
  // de dispositivo próprio) — evita alegações de tempo à disposição fora de turno
  if ((role === "CAIXA" || role === "COZINHA") && !isTrainee) {
    if (!acessoPermitido()) {
      if (isApi) {
        return NextResponse.json(
          { error: "Acesso indisponível fora do horário de expediente.", outOfHours: true },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL("/bloqueio-horario", req.url))
    }
  }

  // COZINHA: acesso exclusivo a /cozinha/*
  if (role === "COZINHA" && !isApi) {
    const allowed = pathname === "/cozinha" || pathname.startsWith("/cozinha/")
    if (!allowed) {
      return NextResponse.redirect(new URL("/cozinha", req.url))
    }
  }

  // CAIXA: bloqueia acesso direto às páginas restritas (trainee tem acesso total)
  if (role === "CAIXA" && !isTrainee && !isApi) {
    const allowedPages = ["/", "/mesas", "/produtos", "/estoque"]
    const allowed = allowedPages.some((p) => pathname === p || pathname.startsWith(p + "/"))
    if (!allowed) {
      return NextResponse.redirect(new URL("/mesas", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|logo\\.png).*)"],
}
