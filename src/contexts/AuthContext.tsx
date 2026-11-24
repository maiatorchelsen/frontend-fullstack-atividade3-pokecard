import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  definirHandlerNaoAutorizado,
  login as loginRequest,
  register as registerRequest,
  TOKEN_STORAGE_KEY,
  USUARIO_STORAGE_KEY,
} from "../services/api";
import type { CredenciaisLogin, DadosRegistro, Usuario } from "../types/auth";

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credenciais: CredenciaisLogin) => Promise<void>;
  register: (dados: DadosRegistro) => Promise<void>;
  logout: () => void;
}

interface Sessao {
  usuario: Usuario | null;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function limparSessao() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USUARIO_STORAGE_KEY);
  } catch {
    // Armazenamento pode estar indisponível em modo privado.
  }
}

function lerSessao(): Sessao {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const usuarioArmazenado = localStorage.getItem(USUARIO_STORAGE_KEY);

    if (!token || !usuarioArmazenado) {
      limparSessao();
      return { usuario: null, token: null };
    }

    return { token, usuario: JSON.parse(usuarioArmazenado) as Usuario };
  } catch {
    limparSessao();
    return { usuario: null, token: null };
  }
}

function salvarSessao(token: string, usuario: Usuario) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(usuario));
  } catch {
    // Mantém a sessão apenas em memória se o armazenamento falhar.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao>(lerSessao);

  const logout = useCallback(() => {
    limparSessao();
    setSessao({ usuario: null, token: null });
  }, []);

  useEffect(() => {
    definirHandlerNaoAutorizado(logout);
    return () => definirHandlerNaoAutorizado(null);
  }, [logout]);

  const login = useCallback(async (credenciais: CredenciaisLogin) => {
    const resposta = await loginRequest(credenciais);
    salvarSessao(resposta.token, resposta.usuario);
    setSessao({ token: resposta.token, usuario: resposta.usuario });
  }, []);

  const register = useCallback(async (dados: DadosRegistro) => {
    await registerRequest(dados);
    await login({ email: dados.email, senha: dados.senha });
  }, [login]);

  const value = useMemo<AuthContextValue>(() => ({
    usuario: sessao.usuario,
    token: sessao.token,
    isAuthenticated: Boolean(sessao.token && sessao.usuario),
    login,
    register,
    logout,
  }), [sessao, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
