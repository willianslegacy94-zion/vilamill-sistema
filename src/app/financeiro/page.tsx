import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinanceiroPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gestao financeira</CardTitle>
          <CardDescription>
            Estrutura inicial para fluxo de caixa, fechamento diario e relatorios.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
