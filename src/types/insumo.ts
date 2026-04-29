export interface Insumo {
  id: string;
  nome: string;
  unidadeMedida: "kg" | "g" | "l" | "ml" | "un";
  quantidadeAtual: number;
  estoqueMinimo: number;
  custoMedio: number;
}
