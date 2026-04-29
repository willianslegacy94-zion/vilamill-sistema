export type StatusMesa = "livre" | "ocupada" | "fechando";

export interface Mesa {
  id: string;
  numero: number;
  capacidade: number;
  status: StatusMesa;
  pedidoAbertoId?: string;
}
