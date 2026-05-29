import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/services/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  const funcionario = await prisma.funcionarioExterno.findUnique({ where: { id } })
  if (!funcionario) {
    return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
  }

  await prisma.funcionarioExterno.update({ where: { id }, data: { ativo: false } })

  return NextResponse.json({ ok: true })
}
