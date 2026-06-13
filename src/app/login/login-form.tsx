"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      usuario: fd.get("usuario"),
      senha:   fd.get("senha"),
      redirect: false,
    })
    if (result?.error) {
      setError("Usuário ou senha incorretos.")
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Usuário</label>
        <input
          name="usuario"
          type="text"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#F4C430] focus:outline-none"
          placeholder="seu usuário"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Senha</label>
        <input
          name="senha"
          type="password"
          required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#F4C430] focus:outline-none"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-[#F4C430] py-2.5 font-semibold text-zinc-900 transition hover:bg-yellow-400 disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
