export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  preco: number;
  ativo: boolean;
}
