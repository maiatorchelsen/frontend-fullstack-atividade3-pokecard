import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PokemonTcgSearch } from "./PokemonTcgSearch";
import type { SugestaoCarta } from "../services/pokemonTcgService";
import type { Carta, CartaPayload } from "../types/carta";

interface CartaFormModalProps {
  carta: Carta | null | undefined;
  onClose: () => void;
  onSubmit: (payload: CartaPayload) => Promise<void>;
}

const emptyForm: CartaPayload = { nome: "", colecao: "", numeroCarta: "", tipo: "Fogo", raridade: "Comum", condicao: "Nova / Perfeita", quantidade: 1, valorEstimado: null, urlImagem: null };
const types = ["Fogo", "Água", "Elétrico", "Psíquico", "Planta", "Incolor", "Lutador", "Metálico", "Dragão", "Sombrio", "Metal"];
const rarities = ["Comum", "Incomum", "Rara", "Ultra Rara", "Ilustração Especial"];
const conditions = ["Nova / Perfeita", "Excelente", "Boa", "Usada"];
const conditionLabels: Record<string, string> = {
  "Near Mint": "Nova / Perfeita",
  Excellent: "Excelente",
  Good: "Boa",
  Played: "Usada",
  "Lightly Played": "Levemente Usada",
};

export function CartaFormModal({ carta, onClose, onSubmit }: CartaFormModalProps) {
  const [form, setForm] = useState<CartaPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importada, setImportada] = useState(false);

  useEffect(() => {
    if (carta) {
      const { id: _id, criadoEm: _date, ...payload } = carta;
      setForm({ ...payload, condicao: conditionLabels[payload.condicao] ?? payload.condicao });
    } else setForm(emptyForm);
    setImportada(false);
  }, [carta]);

  const update = (field: keyof CartaPayload, value: string | number | null) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field !== "quantidade") setImportada(false);
  };

  function aplicarSugestao(sugestao: SugestaoCarta) {
    setForm((current) => ({ ...current, ...sugestao }));
    setImportada(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try { await onSubmit(form); } finally { setSaving(false); }
  }

  return (
    <AnimatePresence>
      {carta !== undefined && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.div className="modal" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24 }}>
            <div className="modal-header"><div><span className="eyebrow">CATÁLOGO</span><h2>{carta ? "Editar carta" : "Nova carta"}</h2></div><button className="close-button" onClick={onClose} aria-label="Fechar">×</button></div>
            <form onSubmit={handleSubmit}>
              <PokemonTcgSearch onSelectCard={aplicarSugestao} />
              {importada && <div className="tcg-imported" role="status">Campos preenchidos pelo catálogo. Confira os valores antes de salvar.</div>}
              <div className="form-grid">
                <label>Nome<input required value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Ex.: Charizard" /></label>
                <label>Coleção<input required value={form.colecao} onChange={(e) => update("colecao", e.target.value)} placeholder="Ex.: Base Set" /></label>
                <label>Número<input required value={form.numeroCarta} onChange={(e) => update("numeroCarta", e.target.value)} placeholder="Ex.: 004/102" /></label>
                <label>Tipo<select value={form.tipo} onChange={(e) => update("tipo", e.target.value)}>{types.map((type) => <option key={type}>{type}</option>)}</select></label>
                <label>Raridade<select value={form.raridade} onChange={(e) => update("raridade", e.target.value)}>{rarities.map((rarity) => <option key={rarity}>{rarity}</option>)}</select></label>
                <label>Conservação<select value={form.condicao} onChange={(e) => update("condicao", e.target.value)}>{conditions.map((condition) => <option key={condition}>{condition}</option>)}</select></label>
                <label>Quantidade<input required min="1" type="number" value={form.quantidade} onChange={(e) => update("quantidade", Number(e.target.value))} /></label>
                <label>Valor estimado<input min="0" step="0.01" type="number" value={form.valorEstimado ?? ""} onChange={(e) => update("valorEstimado", e.target.value ? Number(e.target.value) : null)} placeholder="R$ 0,00" /></label>
                <label className="full-width">URL da imagem<input value={form.urlImagem ?? ""} onChange={(e) => update("urlImagem", e.target.value || null)} placeholder="https://..." /></label>
              </div>
              <div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? "Salvando..." : carta ? "Salvar alterações" : "Adicionar carta"}</button></div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
