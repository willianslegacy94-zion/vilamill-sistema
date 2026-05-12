"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const allLinks = [
  { href: "/mesas",      label: "Mesas",      roles: ["ADMIN", "CAIXA"] },
  { href: "/produtos",   label: "Cardápio",   roles: ["ADMIN", "CAIXA"] },
  { href: "/estoque",    label: "Estoque",    roles: ["ADMIN", "CAIXA"] },
  { href: "/financeiro", label: "Financeiro", roles: ["ADMIN"] },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "CAIXA";
  const isTrainee = (session?.user as any)?.isTrainee ?? false;
  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <>
    {isTrainee && (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-yellow-400 px-4 py-1.5 text-center text-xs font-bold text-yellow-900">
        ⚠ MODO TREINAMENTO — Nenhuma ação é salva no banco de dados
      </div>
    )}
    <nav className={`${isTrainee ? "" : "sticky top-0 "} z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-6 shadow-lg`}>
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo.png" alt="Villa Mill Tamboré" width={44} height={44} className="rounded-full" />
        <span className="hidden text-lg font-bold tracking-tight text-white sm:block">
          Villa Mill <span className="text-[#F4C430]">Tamboré</span>
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {session && links.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                active ? "bg-[#CC1111] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}

        {session && (
          <div className="ml-4 flex items-center gap-3 border-l border-white/10 pl-4">
            <span className="hidden text-sm text-slate-400 sm:block">{session.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
