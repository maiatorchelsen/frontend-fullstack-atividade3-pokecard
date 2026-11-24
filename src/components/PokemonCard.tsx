import { motion } from "framer-motion";
import type { Carta } from "../types/carta";

interface PokemonCardProps {
  carta: Carta;
  onQuantityChange: (carta: Carta, quantidade: number) => void;
  onEdit: (carta: Carta) => void;
  onDelete: (carta: Carta) => void;
}

const typeClass: Record<string, string> = {
  Fogo: "type-fire", Água: "type-water", Elétrico: "type-electric",
  Psíquico: "type-psychic", Planta: "type-grass", Incolor: "type-colorless",
  Lutador: "type-fighting", Metal: "type-metal", Sombrio: "type-dark",
};

function isRare(raridade: string) {
  return raridade === "Ultra Rara" || raridade === "Ilustração Especial";
}

const conditionLabels: Record<string, string> = {
  "Near Mint": "Nova / Perfeita",
  Excellent: "Excelente",
  Good: "Boa",
  Played: "Usada",
  "Lightly Played": "Levemente Usada",
};

export function PokemonCard({ carta, onQuantityChange, onEdit, onDelete }: PokemonCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.28 }}
      whileHover={{ scale: 1.04, rotateY: 5 }}
      className={`pokemon-card ${isRare(carta.raridade) ? "rare-card" : ""}`}
    >
      <div className="card-image-wrap">
        <img
          src={carta.urlImagem || "/card-placeholder.svg"}
          alt={`Carta ${carta.nome}`}
          onError={(event) => { event.currentTarget.src = "/card-placeholder.svg"; }}
        />
        <span className={`type-badge ${typeClass[carta.tipo] ?? "type-default"}`}>{carta.tipo}</span>
        <span className="card-number">#{carta.numeroCarta}</span>
      </div>
      <div className="card-content">
        <div className="card-title-row">
          <div>
            <h3>{carta.nome}</h3>
            <p>{carta.colecao}</p>
          </div>
          <span className="quantity">x{carta.quantidade}</span>
        </div>
        <div className="card-tags">
          <span>{carta.raridade}</span>
          <span>{conditionLabels[carta.condicao] ?? carta.condicao}</span>
        </div>
        <div className="card-footer">
          <strong>{carta.valorEstimado == null ? "—" : carta.valorEstimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          <div className="card-actions">
            <button aria-label={`Diminuir quantidade de ${carta.nome}`} disabled={carta.quantidade <= 1} onClick={() => onQuantityChange(carta, carta.quantidade - 1)}>−</button>
            <button aria-label={`Aumentar quantidade de ${carta.nome}`} onClick={() => onQuantityChange(carta, carta.quantidade + 1)}>+</button>
            <button className="text-action" onClick={() => onEdit(carta)}>Editar</button>
            <button className="text-action danger" onClick={() => onDelete(carta)}>Excluir</button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
