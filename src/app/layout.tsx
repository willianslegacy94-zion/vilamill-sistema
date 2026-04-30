import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navbar from "@/components/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Villa Mill Tamboré | PDV e Gestão",
  description: "Sistema de PDV e gestão para restaurante Villa Mill Tamboré.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
