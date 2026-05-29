import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { prisma } from "@/services/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { password } = await req.json()
  if (!password) {
    return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 })
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    return NextResponse.json({ error: "Administrador não encontrado" }, { status: 404 })
  }

  const ok = await bcrypt.compare(password, admin.senhaHash)
  if (!ok) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
