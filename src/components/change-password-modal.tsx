"use client"

import { useEffect, useRef, useState } from "react"
import { KeyRound, X } from "lucide-react"

interface Props {
  onClose: () => void
}

export default function ChangePasswordModal({ onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setStatus("error")
      setMessage("Todos os campos são obrigatórios")
      return
    }
    if (newPassword.length < 8) {
      setStatus("error")
      setMessage("A nova senha deve ter no mínimo 8 caracteres")
      return
    }
    if (newPassword !== confirmNewPassword) {
      setStatus("error")
      setMessage("A confirmação de senha não confere")
      return
    }
    if (newPassword === currentPassword) {
      setStatus("error")
      setMessage("A nova senha deve ser diferente da senha atual")
      return
    }

    setStatus("loading")
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "Erro ao alterar senha")
        return
      }
      setStatus("success")
      setMessage("Senha alterada com sucesso!")
      setTimeout(onClose, 2000)
    } catch {
      setStatus("error")
      setMessage("Erro de conexão. Tente novamente.")
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <KeyRound className="h-4 w-4 text-[#F4C430]" />
            Alterar Senha
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Senha Atual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#F4C430] focus:outline-none disabled:opacity-50"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">
              Nova Senha <span className="text-slate-500">(mín. 8 caracteres)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#F4C430] focus:outline-none disabled:opacity-50"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#F4C430] focus:outline-none disabled:opacity-50"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {/* Feedback */}
          {message && (
            <p className={`text-xs font-medium ${status === "success" ? "text-green-400" : "text-red-400"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="mt-1 rounded-md bg-[#CC1111] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#aa0e0e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Alterando..." : "Alterar Senha"}
          </button>
        </form>
      </div>
    </div>
  )
}
