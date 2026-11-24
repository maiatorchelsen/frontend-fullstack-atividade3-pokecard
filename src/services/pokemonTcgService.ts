import type { CartaPayload } from "../types/carta";
import type { TcgDexCard, TcgDexCardBrief } from "../types/tcgDexApi";

const API_URL = import.meta.env.DEV
  ? "/tcgdex/v2/pt/cards"
  : "https://api.tcgdex.net/v2/pt/cards";
const PAGE_SIZE = 12;
const TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 400;
const COTACAO_EUR_BRL_REFERENCIA = 6.2;

export type SugestaoCarta = Pick<
  CartaPayload,
  "nome" | "colecao" | "numeroCarta" | "tipo" | "raridade" | "valorEstimado" | "urlImagem"
>;

const tipos: Record<string, string> = {
  Fire: "Fogo",
  Fogo: "Fogo",
  Water: "Água",
  Água: "Água",
  Grass: "Planta",
  Planta: "Planta",
  Lightning: "Elétrico",
  Elétrico: "Elétrico",
  Psychic: "Psíquico",
  Psíquico: "Psíquico",
  Fighting: "Lutador",
  Lutador: "Lutador",
  Darkness: "Sombrio",
  Sombrio: "Sombrio",
  Metal: "Metal",
  Metálico: "Metal",
  Dragon: "Dragão",
  Dragão: "Dragão",
  Colorless: "Incolor",
  Incolor: "Incolor",
};

export class PokemonTcgTimeoutError extends Error {
  constructor() {
    super("A consulta ao catálogo demorou mais que o esperado.");
    this.name = "PokemonTcgTimeoutError";
  }
}

export function traduzirTipo(tipo: string): string {
  return tipos[tipo] ?? "Incolor";
}

export function mapearRaridade(raridade?: string): string {
  if (!raridade) return "Comum";
  const normalizada = raridade.toLowerCase();
  if (normalizada.includes("ilustração especial") || normalizada.includes("special illustration")) return "Ilustração Especial";
  if (normalizada.includes("ultra")) return "Ultra Rara";
  if (normalizada.includes("incomum") || normalizada.includes("uncommon")) return "Incomum";
  if (normalizada.includes("comum") || normalizada.includes("common")) return "Comum";
  if (normalizada.includes("rara") || normalizada.includes("rare")) return "Rara";
  return raridade;
}

export function mapearCartaExterna(card: TcgDexCard): SugestaoCarta {
  const precoMedio = card.pricing?.cardmarket?.avg;
  const valorEstimado = card.pricing?.cardmarket?.unit === "EUR" &&
    typeof precoMedio === "number" && Number.isFinite(precoMedio) && precoMedio > 0
    ? Math.round(precoMedio * COTACAO_EUR_BRL_REFERENCIA * 100) / 100
    : null;

  return {
    nome: card.name,
    colecao: card.set.name,
    numeroCarta: `${card.localId}/${card.set.cardCount.official ?? card.set.cardCount.total}`,
    tipo: traduzirTipo(card.types?.[0] ?? "Incolor"),
    raridade: mapearRaridade(card.rarity),
    urlImagem: card.image ? `${card.image}/high.webp` : null,
    valorEstimado,
  };
}

async function buscarJson<T>(url: URL, signal: AbortSignal | undefined, mensagemErro: string): Promise<T> {
  const controller = new AbortController();
  let expirou = false;

  const repassarCancelamento = () => controller.abort(signal?.reason);
  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener("abort", repassarCancelamento, { once: true });

  const timeoutId = window.setTimeout(() => {
    expirou = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    let response: Response | null = null;
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      response = await fetch(url, { signal: controller.signal });
      if (![500, 502, 503, 504].includes(response.status) || tentativa === 1) break;
      await new Promise<void>((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS));
    }

    if (!response) throw new Error(mensagemErro);
    if (response.status === 429) {
      throw new Error("Muitas buscas em sequência. Aguarde um instante e tente novamente.");
    }
    if (!response.ok) throw new Error(mensagemErro);
    return await response.json() as T;
  } catch (erro) {
    if (signal?.aborted) throw erro;
    if (expirou) throw new PokemonTcgTimeoutError();
    throw erro;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", repassarCancelamento);
  }
}

export async function buscarCartasExternas(nome: string, signal?: AbortSignal): Promise<TcgDexCardBrief[]> {
  const termo = nome.trim();
  if (termo.length < 3) return [];

  const url = new URL(API_URL, window.location.origin);
  url.searchParams.set("name", termo);
  url.searchParams.set("pagination:page", "1");
  url.searchParams.set("pagination:itemsPerPage", String(PAGE_SIZE));

  const cards = await buscarJson<TcgDexCardBrief[]>(
    url,
    signal,
    "O catálogo de cartas não respondeu. Tente novamente mais tarde.",
  );
  return Array.isArray(cards) ? cards : [];
}

export function obterCartaExterna(id: string, signal?: AbortSignal): Promise<TcgDexCard> {
  const url = new URL(`${API_URL}/${encodeURIComponent(id)}`, window.location.origin);
  return buscarJson<TcgDexCard>(
    url,
    signal,
    "Não foi possível carregar os dados da carta selecionada.",
  );
}
