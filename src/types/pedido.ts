export type StatusPedido = "aberto" | "em_preparo" | "entregue" | "finalizado";

export interface ItemPedido {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: string;
  mesaId: string;
  itens: ItemPedido[];
  status: StatusPedido;
  subtotal: number;
  taxaServico: number;
  total: number;
  criadoEm: string;
}
