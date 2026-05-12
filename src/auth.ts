import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/services/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        usuario: { label: "Usuário", type: "text" },
        senha:   { label: "Senha",   type: "password" },
      },
      async authorize(credentials) {
        const usuario = credentials?.usuario as string | undefined
        const senha   = credentials?.senha   as string | undefined
        if (!usuario || !senha) return null

        const user = await prisma.user.findUnique({ where: { email: usuario } })
        if (!user || !(await bcrypt.compare(senha, user.senhaHash))) return null

        return { id: user.id, name: user.nome, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.isTrainee = (user as any).email === "treinamento"
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).isTrainee = token.isTrainee
      }
      return session
    },
  },
  pages: { signIn: "/login" },
})
