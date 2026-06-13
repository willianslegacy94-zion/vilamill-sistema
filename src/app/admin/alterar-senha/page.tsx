"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function AlterarSenhaPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setStatus("error");
      setMessage("Todos os campos são obrigatórios.");
      return;
    }
    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setStatus("error");
      setMessage("A confirmação de senha não confere.");
      return;
    }
    if (newPassword === currentPassword) {
      setStatus("error");
      setMessage("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Erro ao alterar senha.");
        return;
      }
      setStatus("success");
      setMessage("Senha alterada com sucesso!");
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setStatus("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#CC1111]" />
            <h1 className="text-lg font-bold text-slate-800">Alterar Senha</h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {/* Senha atual */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Senha Atual</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={status === "loading" || status === "success"}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 focus:border-[#CC1111] focus:outline-none focus:ring-1 focus:ring-[#CC1111] disabled:opacity-50"
                placeholder="Digite sua senha atual"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Nova Senha <span className="text-xs text-slate-400">(mín. 8 caracteres)</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={status === "loading" || status === "success"}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 focus:border-[#CC1111] focus:outline-none focus:ring-1 focus:ring-[#CC1111] disabled:opacity-50"
                placeholder="Digite a nova senha"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar nova senha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={status === "loading" || status === "success"}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 focus:border-[#CC1111] focus:outline-none focus:ring-1 focus:ring-[#CC1111] disabled:opacity-50"
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Feedback */}
          {message && (
            <p className={`text-sm font-medium ${status === "success" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="mt-1 rounded-md bg-[#CC1111] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#aa0e0e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Alterando..." : status === "success" ? "Senha alterada!" : "Alterar Senha"}
          </button>
        </form>
      </div>
    </main>
  );
}
