import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import LoginForm from "./login-form"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-800 p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Villa Mill" width={64} height={64} className="rounded-full" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Villa Mill <span className="text-[#F4C430]">Tamboré</span></h1>
            <p className="mt-0.5 text-sm text-slate-400">Acesso ao sistema</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
