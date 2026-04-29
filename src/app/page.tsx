import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Villa Mill Tambore</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Base inicial do sistema de PDV e Gestao do restaurante.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mesas</CardTitle>
            <CardDescription>Controle de ocupacao e pedidos em andamento.</CardDescription>
          </CardHeader>
          <Link href="/mesas">
            <Button variant="outline" className="mt-4 w-full">
              Acessar modulo
            </Button>
          </Link>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque</CardTitle>
            <CardDescription>Gestao de insumos e niveis minimos por item.</CardDescription>
          </CardHeader>
          <Link href="/estoque">
            <Button variant="outline" className="mt-4 w-full">
              Acessar modulo
            </Button>
          </Link>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
            <CardDescription>Resumo de caixa, vendas e indicadores diarios.</CardDescription>
          </CardHeader>
          <Link href="/financeiro">
            <Button variant="outline" className="mt-4 w-full">
              Acessar modulo
            </Button>
          </Link>
        </Card>
      </section>
    </main>
  );
}
