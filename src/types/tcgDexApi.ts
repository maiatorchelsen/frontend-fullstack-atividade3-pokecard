export interface TcgDexCardBrief {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

export interface TcgDexCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
  rarity?: string;
  types?: string[];
  set: {
    name: string;
    cardCount: {
      official?: number;
      total: number;
    };
  };
  pricing?: {
    cardmarket?: {
      avg?: number;
      unit?: string;
    };
  };
}
