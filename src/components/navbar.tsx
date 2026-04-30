"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/mesas",      label: "Mesas" },
  { href: "/produtos",   label: "Cardápio" },
  { href: "/estoque",    label: "Estoque" },
  { href: "/financeiro", label: "Financeiro" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-6 shadow-lg">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo.png" alt="Villa Mill Tamboré" width={44} height={44} className="rounded-full" />
        <span className="hidden text-lg font-bold tracking-tight text-white sm:block">
          Villa Mill <span className="text-[#F4C430]">Tamboré</span>
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#CC1111] text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
