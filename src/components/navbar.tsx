"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, LayoutGrid, BookOpen, Package, TrendingUp, Receipt, LogOut } from "lucide-react";

const allLinks = [
  { href: "/",           label: "Início",     icon: Home,        roles: ["ADMIN", "CAIXA"] },
  { href: "/mesas",      label: "Mesas",      icon: LayoutGrid,  roles: ["ADMIN", "CAIXA"] },
  { href: "/produtos",   label: "Cardápio",   icon: BookOpen,    roles: ["ADMIN", "CAIXA"] },
  { href: "/estoque",    label: "Estoque",    icon: Package,     roles: ["ADMIN", "CAIXA"] },
  { href: "/despesas",   label: "Despesas",   icon: Receipt,     roles: ["ADMIN"] },
  { href: "/financeiro", label: "Financeiro", icon: TrendingUp,  roles: ["ADMIN"] },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "CAIXA";
  const isTrainee = (session?.user as any)?.isTrainee ?? false;
  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <>
      {/* Banner de treinamento */}
      {isTrainee && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-yellow-400 px-4 py-2 text-center text-xs font-bold text-yellow-900">
          ⚠ MODO TREINAMENTO — Nenhuma ação é salva no banco de dados
        </div>
      )}

      {/* Top navbar */}
      <nav className={`${isTrainee ? "" : "sticky top-0 "}z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-4 shadow-lg`}>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Villa Mill Tamboré" width={36} height={36} className="rounded-full" />
          <span className="hidden text-base font-bold tracking-tight text-white sm:block">
            Villa Mill <span className="text-[#F4C430]">Tamboré</span>
          </span>
        </Link>

        {/* Links desktop (md+) */}
        {session && (
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(href, pathname)
                    ? "bg-[#CC1111] text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Usuário + logout */}
        {session && (
          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <span className="hidden text-sm text-slate-400 sm:block">{session.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom nav — mobile apenas (md oculto) */}
      {session && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t border-slate-200 bg-white md:hidden">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-center transition-colors ${
                  active ? "text-[#CC1111]" : "text-slate-500"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
