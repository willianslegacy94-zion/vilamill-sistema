import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MesasPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Mesas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gestao de salao</CardTitle>
          <CardDescription>
            Estrutura pronta para listar mesas, abrir pedido e acompanhar status.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
