export interface Carta {
  id: string;
  nome: string;
  colecao: string;
  numeroCarta: string;
  tipo: string;
  raridade: string;
  condicao: string;
  quantidade: number;
  valorEstimado: number | null;
  urlImagem: string | null;
  criadoEm: string;
}

export interface ResumoColecao {
  totalCartasFisicas: number;
  totalCartasUnicas: number;
  valorTotalEstimado: number;
}

export type CartaPayload = Omit<Carta, "id" | "criadoEm">;
