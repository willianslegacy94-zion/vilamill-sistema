import { auth } from "@/auth"
import { NextResponse } from "next/server"

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
