import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CartaFormModal } from "../components/CartaFormModal";
import { PokemonCard } from "../components/PokemonCard";
import { useAuth } from "../contexts/AuthContext";
import { atualizarCarta, criarCarta, excluirCarta, listarCartas, obterResumo } from "../services/api";
import type { Carta, CartaPayload, ResumoColecao } from "../types/carta";

const initialSummary: ResumoColecao = { totalCartasFisicas: 0, totalCartasUnicas: 0, valorTotalEstimado: 0 };

export default function DashboardPage() {
  const { usuario, logout } = useAuth();
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [resumo, setResumo] = useState(initialSummary);
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [raridade, setRaridade] = useState("");
  const [modalCarta, setModalCarta] = useState<Carta | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [cards, summary] = await Promise.all([listarCartas(), obterResumo()]);
      setCartas(cards); setResumo(summary);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar a coleção."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filteredCards = useMemo(() => cartas.filter((card) =>
    card.nome.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
    (!tipo || card.tipo === tipo) && (!raridade || card.raridade === raridade)
  ), [cartas, search, tipo, raridade]);

  async function save(payload: CartaPayload) {
    try {
      if (modalCarta) await atualizarCarta(modalCarta.id, payload);
      else await criarCarta(payload);
      setModalCarta(undefined); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar a carta."); }
  }
  async function changeQuantity(card: Carta, quantidade: number) {
    try { const updated = await atualizarCarta(card.id, { quantidade }); setCartas((current) => current.map((item) => item.id === card.id ? updated : item)); setResumo((current) => ({ ...current, totalCartasFisicas: current.totalCartasFisicas + quantidade - card.quantidade })); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível atualizar a quantidade."); }
  }
  async function remove(card: Carta) {
    if (!window.confirm(`Excluir ${card.nome} da coleção?`)) return;
    try { await excluirCarta(card.id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível excluir a carta."); }
  }

  return (
    <main>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="shell">
        <header className="topbar">
          <div className="brand"><div className="pokeball"><span /></div><div><h1>Meu Fichário<span>TCG</span></h1><p>SUA COLEÇÃO, SEU LEGADO</p></div></div>
          <div className="topbar-actions">
            <button className="primary-button" onClick={() => setModalCarta(null)}>＋ Nova carta</button>
            <div className="user-menu">
              <div className="user-avatar">{usuario?.nome.charAt(0).toUpperCase() ?? "T"}</div>
              <div className="user-info"><span>TREINADOR</span><strong>{usuario?.nome ?? "Treinador"}</strong></div>
              <button className="logout-button" onClick={logout}>Sair</button>
            </div>
          </div>
        </header>
        <section className="hero"><div><span className="eyebrow">PAINEL DO COLECIONADOR</span><h2>Suas cartas.<br /><em>Seu universo.</em></h2><p>Organize, acompanhe e valorize cada peça da sua coleção Pokémon TCG.</p></div><img className="hero-mark" src="/snorla.png" alt="" aria-hidden="true" /></section>
        <section className="stats">
          <div className="stat"><span className="stat-icon blue">▣</span><div><p>TOTAL DE CARTAS</p><strong>{resumo.totalCartasFisicas}</strong><small>peças na coleção</small></div></div>
          <div className="stat"><span className="stat-icon purple">◈</span><div><p>CARTAS ÚNICAS</p><strong>{resumo.totalCartasUnicas}</strong><small>itens catalogados</small></div></div>
          <div className="stat"><span className="stat-icon gold">◆</span><div><p>VALOR ESTIMADO</p><strong>{resumo.valorTotalEstimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</strong><small>valor da coleção</small></div></div>
        </section>
        <section className="collection-header"><div><h2>Minha coleção <span>{filteredCards.length}</span></h2><p>Explore suas cartas catalogadas</p></div><div className="filters"><label className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome..." /></label><select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos os tipos</option>{["Fogo", "Água", "Elétrico", "Psíquico", "Planta", "Incolor", "Lutador", "Metálico", "Dragão", "Sombrio", "Metal"].map((item) => <option key={item}>{item}</option>)}</select><select value={raridade} onChange={(e) => setRaridade(e.target.value)}><option value="">Todas as raridades</option>{["Comum", "Incomum", "Rara", "Ultra Rara", "Ilustração Especial"].map((item) => <option key={item}>{item}</option>)}</select></div></section>
        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {loading ? <div className="state-message">Carregando sua coleção...</div> : filteredCards.length ? <motion.div layout className="cards-grid"><AnimatePresence mode="popLayout">{filteredCards.map((card) => <PokemonCard key={card.id} carta={card} onQuantityChange={changeQuantity} onEdit={setModalCarta} onDelete={remove} />)}</AnimatePresence></motion.div> : <div className="state-message"><strong>Nenhuma carta encontrada</strong><span>Ajuste os filtros ou adicione uma nova carta à coleção.</span></div>}
      </div>
      <CartaFormModal carta={modalCarta} onClose={() => setModalCarta(undefined)} onSubmit={save} />
    </main>
  );
}
