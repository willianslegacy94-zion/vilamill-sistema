import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EstoquePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
      <Card>
        <CardHeader>
          <CardTitle>Controle de insumos</CardTitle>
          <CardDescription>
            Base preparada para entradas, saidas e alertas de estoque minimo.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
