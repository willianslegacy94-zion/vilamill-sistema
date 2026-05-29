import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { prisma } from "@/services/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { currentPassword, newPassword, confirmNewPassword } = await req.json()

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "A nova senha deve ter no mínimo 8 caracteres" }, { status: 400 })
  }
  if (newPassword !== confirmNewPassword) {
    return NextResponse.json({ error: "A confirmação de senha não confere" }, { status: 400 })
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "A nova senha deve ser diferente da senha atual" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  const senhaCorreta = await bcrypt.compare(currentPassword, user.senhaHash)
  if (!senhaCorreta) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
  }

  const senhaHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { senhaHash } })

  return NextResponse.json({ message: "Senha alterada com sucesso" })
}
