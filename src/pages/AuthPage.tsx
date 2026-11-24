import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../services/api";

type Modo = "login" | "register";

const formVariants: Variants = {
  enter: (direcao: number) => ({ opacity: 0, x: direcao * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (direcao: number) => ({ opacity: 0, x: direcao * -40 }),
};

const mensagensAmigaveis: Record<string, string> = {
  "E-mail ou senha inválidos.": "E-mail ou senha incorretos. Confira os dados e tente novamente.",
  "E-mail já cadastrado.": "Este e-mail já está em uso. Que tal entrar na sua conta?",
  "Dados inválidos.": "Confira os campos destacados e tente novamente.",
};

function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    const campoInvalido = Object.values(erro.fieldErrors).flat()[0];
    if (campoInvalido) return campoInvalido;
    return mensagensAmigaveis[erro.message] ?? erro.message;
  }
  if (erro instanceof TypeError) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }
  return "Algo deu errado. Tente novamente em instantes.";
}

export default function AuthPage() {
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const origem = (location.state as { from?: string } | null)?.from ?? "/";

  const [modo, setModo] = useState<Modo>("login");
  const [direcao, setDirecao] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });

  useEffect(() => {
    if (isAuthenticated) navigate(origem, { replace: true });
  }, [isAuthenticated, navigate, origem]);

  function alternarModo(novoModo: Modo) {
    if (novoModo === modo) return;
    setDirecao(novoModo === "login" ? -1 : 1);
    setModo(novoModo);
    setErro("");
  }

  function atualizarCampo(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      if (modo === "login") {
        await login({ email: form.email.trim(), senha: form.senha });
      } else {
        await register({ nome: form.nome.trim(), email: form.email.trim(), senha: form.senha });
      }
      navigate(origem, { replace: true });
    } catch (erroInesperado) {
      setErro(mensagemDoErro(erroInesperado));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="auth-layout">
        <section className="auth-intro">
          <div className="brand">
            <div className="pokeball"><span /></div>
            <div><h1>PokéVault<span>TCG</span></h1><p>SUA COLEÇÃO, SEU LEGADO</p></div>
          </div>
          <h2>Seu fichário,<br /><em>sempre por perto.</em></h2>
          <p>Entre na sua conta para organizar cartas, acompanhar valores e proteger sua coleção Pokémon.</p>
          <div className="auth-perks">
            <span>◆ Coleção sincronizada</span>
            <span>◆ Valores sempre atualizados</span>
            <span>◆ Acesso seguro com JWT</span>
          </div>
          <img className="auth-mark" src="/snorla.png" alt="" aria-hidden="true" />
        </section>

        <section className="auth-panel" aria-label={modo === "login" ? "Entrar" : "Criar conta"}>
          <div className="auth-tabs" role="tablist">
            {(["login", "register"] as const).map((opcao) => (
              <button
                key={opcao}
                type="button"
                role="tab"
                aria-selected={modo === opcao}
                className={modo === opcao ? "auth-tab active" : "auth-tab"}
                onClick={() => alternarModo(opcao)}
              >
                {modo === opcao && (
                  <motion.span
                    layoutId="auth-tab-indicator"
                    className="auth-tab-indicator"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="auth-tab-label">{opcao === "login" ? "Entrar" : "Criar conta"}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" custom={direcao} initial={false}>
            <motion.form
              key={modo}
              className="auth-form"
              custom={direcao}
              variants={formVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: "easeOut" }}
              onSubmit={handleSubmit}
            >
              <div className="auth-form-heading">
                <span className="eyebrow">{modo === "login" ? "BEM-VINDO DE VOLTA" : "NOVO TREINADOR"}</span>
                <h2>{modo === "login" ? "Acesse seu vault" : "Comece sua jornada"}</h2>
                <p>{modo === "login" ? "Use seu e-mail e senha para continuar." : "Crie sua conta em poucos segundos."}</p>
              </div>

              {modo === "register" && (
                <label className="auth-field">
                  <span>Nome do treinador</span>
                  <input
                    id="auth-nome"
                    type="text"
                    autoComplete="name"
                    placeholder="Como podemos te chamar?"
                    value={form.nome}
                    onChange={(evento) => atualizarCampo("nome", evento.target.value)}
                    required
                    minLength={1}
                  />
                </label>
              )}

              <label className="auth-field">
                <span>E-mail</span>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="treinador@email.com"
                  value={form.email}
                  onChange={(evento) => atualizarCampo("email", evento.target.value)}
                  required
                />
              </label>

              <label className="auth-field">
                <span>Senha</span>
                <input
                  id="auth-senha"
                  type="password"
                  autoComplete={modo === "login" ? "current-password" : "new-password"}
                  placeholder={modo === "login" ? "Sua senha" : "Mínimo de 6 caracteres"}
                  value={form.senha}
                  onChange={(evento) => atualizarCampo("senha", evento.target.value)}
                  required
                  minLength={modo === "register" ? 6 : 1}
                />
              </label>

              {erro && <div className="auth-error" role="alert">{erro}</div>}

              <button className="primary-button auth-submit" type="submit" disabled={carregando}>
                {carregando ? <><span className="spinner" aria-hidden="true" />Aguarde...</> : modo === "login" ? "Entrar" : "Criar conta"}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="auth-footer-hint">
            {modo === "login" ? "Ainda não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button type="button" onClick={() => alternarModo(modo === "login" ? "register" : "login")}>
              {modo === "login" ? "Cadastre-se" : "Entre aqui"}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
