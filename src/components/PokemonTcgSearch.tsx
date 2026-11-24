import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  PokemonTcgTimeoutError,
  buscarCartasExternas,
  mapearCartaExterna,
  obterCartaExterna,
} from "../services/pokemonTcgService";
import type { SugestaoCarta } from "../services/pokemonTcgService";
import type { TcgDexCardBrief } from "../types/tcgDexApi";

type Estado = "idle" | "loading" | "ready" | "empty" | "error" | "timeout";

interface PokemonTcgSearchProps {
  onSelectCard: (sugestao: SugestaoCarta) => void;
}

export function PokemonTcgSearch({ onSelectCard }: PokemonTcgSearchProps) {
  const [termo, setTermo] = useState("");
  const [cartas, setCartas] = useState<TcgDexCardBrief[]>([]);
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensagem, setMensagem] = useState("");
  const [selecionandoId, setSelecionandoId] = useState<string | null>(null);
  const detalheController = useRef<AbortController | null>(null);

  useEffect(() => {
    const termoLimpo = termo.trim();
    detalheController.current?.abort();

    if (termoLimpo.length < 3) {
      setCartas([]);
      setEstado("idle");
      setMensagem("");
      return;
    }

    const controller = new AbortController();
    setEstado("loading");
    setMensagem("");

    const timer = window.setTimeout(async () => {
      try {
        const resultados = await buscarCartasExternas(termoLimpo, controller.signal);
        if (controller.signal.aborted) return;

        setCartas(resultados);
        setEstado(resultados.length ? "ready" : "empty");
        setMensagem(resultados.length ? "" : "Nenhuma carta encontrada. Continue preenchendo manualmente.");
      } catch (erro) {
        if (controller.signal.aborted) return;

        setCartas([]);
        setEstado(erro instanceof PokemonTcgTimeoutError ? "timeout" : "error");
        setMensagem(
          erro instanceof PokemonTcgTimeoutError
            ? "A busca está demorando mais que o esperado. Você pode preencher os campos manualmente."
            : `${erro instanceof Error ? erro.message : "Não foi possível consultar o catálogo."} Preencha manualmente, se preferir.`,
        );
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      detalheController.current?.abort();
    };
  }, [termo]);

  async function selecionar(card: TcgDexCardBrief) {
    detalheController.current?.abort();
    const controller = new AbortController();
    detalheController.current = controller;
    setSelecionandoId(card.id);
    setMensagem("");

    try {
      const detalhes = await obterCartaExterna(card.id, controller.signal);
      if (controller.signal.aborted) return;

      onSelectCard(mapearCartaExterna(detalhes));
      setTermo("");
      setCartas([]);
      setEstado("idle");
    } catch (erro) {
      if (controller.signal.aborted) return;
      setEstado(erro instanceof PokemonTcgTimeoutError ? "timeout" : "error");
      setMensagem(
        erro instanceof PokemonTcgTimeoutError
          ? "A consulta está demorando mais que o esperado. Tente novamente."
          : erro instanceof Error ? erro.message : "Não foi possível carregar os dados da carta.",
      );
    } finally {
      if (detalheController.current === controller) {
        detalheController.current = null;
        setSelecionandoId(null);
      }
    }
  }

  const avisoCurto = termo.trim().length > 0 && termo.trim().length < 3;

  return (
    <div className="tcg-search">
      <label className="tcg-search-field">
        <span>Buscar no catálogo Pokémon TCG em português</span>
        <div className="tcg-search-input">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={termo}
            placeholder="Ex.: Charizard, Pikachu, Mewtwo..."
            onChange={(evento) => setTermo(evento.target.value)}
          />
          {estado === "loading" && <span className="spinner tcg-spinner" aria-hidden="true" />}
        </div>
      </label>

      <div className="tcg-feedback" role="status" aria-live="polite">
        {avisoCurto && <span>Digite pelo menos 3 caracteres para buscar.</span>}
        {estado === "loading" && (
          <span className="tcg-loading">
            Buscando cartas<span className="tcg-dots">...</span>
            <span className="tcg-skeletons" aria-hidden="true"><i /><i /><i /></span>
          </span>
        )}
        {(estado === "empty" || estado === "error" || estado === "timeout") && <span>{mensagem}</span>}
      </div>

      <AnimatePresence initial={false}>
        {!avisoCurto && cartas.length > 0 && (
          <motion.div
            className="tcg-results"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {cartas.map((card, index) => (
              <motion.button
                key={card.id}
                type="button"
                className="tcg-result"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: index * 0.025 }}
                onClick={() => selecionar(card)}
                disabled={selecionandoId !== null}
                title={`Preencher com ${card.name}`}
              >
                <img
                  src={card.image ? `${card.image}/low.webp` : "/card-placeholder.svg"}
                  alt=""
                  loading="lazy"
                  onError={(event) => { event.currentTarget.src = "/card-placeholder.svg"; }}
                />
                <span className="tcg-result-info">
                  <strong>{card.name}</strong>
                  <small className="tcg-result-number">Carta #{card.localId}</small>
                  {selecionandoId === card.id && <small>Carregando dados...</small>}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
