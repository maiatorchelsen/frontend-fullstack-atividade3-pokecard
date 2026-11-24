import type { CredenciaisLogin, DadosRegistro, RespostaLogin, Usuario } from "../types/auth";
import type { Carta, CartaPayload, ResumoColecao } from "../types/carta";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const TOKEN_STORAGE_KEY = "pokemonvault.token";
export const USUARIO_STORAGE_KEY = "pokemonvault.usuario";

type ErrosCampo = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ErrosCampo;

  constructor(mensagem: string, status: number, fieldErrors: ErrosCampo = {}) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function definirHandlerNaoAutorizado(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  autenticada?: boolean;
}

function obterToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit, options: RequestOptions = {}): Promise<T> {
  const { autenticada = true } = options;
  const token = autenticada ? obterToken() : null;
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    let mensagem = `Não foi possível concluir a operação (${response.status}).`;
    let fieldErrors: ErrosCampo = {};

    try {
      const body = (await response.json()) as { mensagem?: string; erros?: ErrosCampo };
      if (body.mensagem) mensagem = body.mensagem;
      if (body.erros) fieldErrors = body.erros;
    } catch {
      // A API pode responder sem JSON em erros de infraestrutura.
    }

    if (response.status === 401 && autenticada) {
      unauthorizedHandler?.();
      mensagem = "Sua sessão expirou. Entre novamente para continuar.";
    }

    throw new ApiError(mensagem, response.status, fieldErrors);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const login = (credenciais: CredenciaisLogin) =>
  request<RespostaLogin>(
    "/auth/login",
    { method: "POST", body: JSON.stringify(credenciais) },
    { autenticada: false },
  );

export const register = (dados: DadosRegistro) =>
  request<Usuario>(
    "/auth/register",
    { method: "POST", body: JSON.stringify(dados) },
    { autenticada: false },
  );

export const listarCartas = (params?: { nome?: string; tipo?: string; raridade?: string }) => {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => value && query.set(key, value));
  return request<Carta[]>(`/cartas${query.size ? `?${query}` : ""}`);
};

export const obterResumo = () => request<ResumoColecao>("/cartas/resumo");
export const criarCarta = (payload: CartaPayload) =>
  request<Carta>("/cartas", { method: "POST", body: JSON.stringify(payload) });
export const atualizarCarta = (id: string, payload: Partial<CartaPayload>) =>
  request<Carta>(`/cartas/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const excluirCarta = (id: string) =>
  request<void>(`/cartas/${id}`, { method: "DELETE" });
