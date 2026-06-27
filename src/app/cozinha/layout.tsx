import type { Metadata } from "next";
import Providers from "@/components/session-provider";

export const metadata: Metadata = {
  title: "Villa Mill — Cozinha",
  description: "KDS da Cozinha",
};

export default function CozinhaLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-zinc-950 text-white">{children}</div>
    </Providers>
  );
}
