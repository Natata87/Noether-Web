import React, { useState } from 'react';
import { Compass, Shield, Sword, Sparkles, Heart, ChevronRight, Star, ArrowLeft, Zap } from 'lucide-react';
import {
  RARITY,
  FAMILIAR_SPECIES,
  familiarStatsAtLevel,
  tipoLabel
} from '../data/core.js';

export function CreaturesScreen({ character, setActiveTab, onSelect }) {
  const familiares = character.familiares || [];
  if (familiares.length === 0) {
    return (
      <div className="flex flex-col gap-3 pt-4">
        <div className="panel rounded-2xl p-4 text-center"><p className="text-sm text-muted">Você ainda não capturou nenhum Familiar.</p></div>
        <button onClick={() => setActiveTab('mapa')} className="panel rounded-2xl p-4 flex items-center justify-center gap-2 text-muted">
          <Compass size={16} /><span className="text-sm">Vá até a Fissura pra capturar seu primeiro Familiar</span>
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className="text-xs text-muted uppercase tracking-wide">Seus Familiares</p>
      {familiares.map((inst) => {
        const species = FAMILIAR_SPECIES[inst.speciesId];
        return (
          <button key={inst.instanceId} onClick={() => onSelect(inst)} className="creature-card p-3 flex items-center gap-3 text-left">
            <img src={species.img} alt={species.name} style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm text-parchment">{inst.nickname}</span>
                <span className="tag-pill text-muted">Nv. {inst.level}</span>
              </div>
              <div className="energy-badge mt-1">{tipoLabel(species.tipo)}</div>
            </div>
            {inst.favorite && <Star size={14} className="text-gold" />}
            <ChevronRight size={16} className="text-muted" />
          </button>
        );
      })}
    </div>
  );
}

export function FamiliarDetailScreen({ instance, character, onUpdateCharacter, onClose }) {
  const species = FAMILIAR_SPECIES[instance.speciesId];
  const stats = familiarStatsAtLevel(species, instance.level);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(instance.nickname);

  function updateInstance(patch) {
    const familiares = character.familiares.map((f) => (f.instanceId === instance.instanceId ? { ...f, ...patch } : f));
    onUpdateCharacter({ ...character, familiares });
  }
  function saveRename() {
    if (!nameInput.trim()) return;
    updateInstance({ nickname: nameInput.trim() });
    setRenaming(false);
  }
  function liberar() {
    const familiares = character.familiares.filter((f) => f.instanceId !== instance.instanceId);
    onUpdateCharacter({ ...character, familiares });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="panel rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 overflow-y-auto no-scrollbar" style={{ maxHeight: '88vh' }}>
        <div className="flex items-center justify-between">
          <button onClick={onClose}><ArrowLeft size={18} className="text-muted" /></button>
          <span className="tag-pill text-gold">{RARITY[species.rarity].label}</span>
          <button onClick={() => updateInstance({ favorite: !instance.favorite })}><Star size={18} className={instance.favorite ? 'text-gold' : 'text-muted'} /></button>
        </div>

        <div className="flex flex-col items-center gap-1">
          {renaming ? (
            <div className="flex gap-2 w-full">
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={16} className="input-field" />
              <button onClick={saveRename} className="btn-secondary">OK</button>
            </div>
          ) : (
            <span className="font-display text-lg text-parchment">{instance.nickname}</span>
          )}
          <span className="text-xs text-muted">{species.especie}</span>
          <div className="energy-badge mt-1">{tipoLabel(species.tipo)}</div>
        </div>

        <img src={species.img} alt={species.name} style={{ height: 150, objectFit: 'contain', alignSelf: 'center' }} />

        <div className="flex items-center justify-between text-tiny text-muted">
          <span>Nível {instance.level}</span>
          <span>Capturado em: {instance.capturedLocation}</span>
        </div>

        <div className="panel rounded-xl p-3">
          <p className="text-tiny text-gold uppercase tracking-wide mb-2">Status</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between"><span className="text-xs text-muted flex items-center gap-1"><Heart size={12} className="text-crimson" /> Vida</span><span className="text-xs text-parchment">{stats.vida}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted flex items-center gap-1"><Sword size={12} /> Ataque</span><span className="text-xs text-parchment">{stats.ataque}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted flex items-center gap-1"><Shield size={12} /> Defesa</span><span className="text-xs text-parchment">{stats.defesa}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted flex items-center gap-1"><Zap size={12} /> Velocidade</span><span className="text-xs text-parchment">{stats.velocidade}</span></div>
          </div>
        </div>

        <div className="panel rounded-xl p-3 flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          <div><p className="text-xs text-parchment font-semibold">{species.passiva.name}</p><p className="text-tiny text-muted mt-1">{species.passiva.desc}</p></div>
        </div>

        <div>
          <p className="text-tiny text-gold uppercase tracking-wide mb-2">Ataques</p>
          <div className="flex flex-col gap-2">
            {species.ataques.map((a, i) => (
              <div key={i} className="panel rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-parchment font-semibold">{a.name}</span>
                  <span className="tag-pill text-muted">{tipoLabel(a.tipo)}</span>
                </div>
                <p className="text-tiny text-muted mt-1">{a.power > 0 ? `Poder ${a.power} · Precisão ${a.acc}%` : a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-xl p-3">
          <p className="text-tiny text-gold uppercase tracking-wide mb-1">Sobre</p>
          <p className="text-xs text-muted leading-snug">{species.sobre}</p>
          <div className="flex gap-3 mt-2 text-tiny text-muted flex-wrap">
            <span>Personalidade: {species.personalidade}</span>
            <span>Tamanho: {species.tamanho}</span>
            <span>Peso: {species.peso}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setRenaming(true)} className="btn-secondary">Renomear</button>
          <button onClick={liberar} className="btn-secondary" style={{ color: '#e0895c', borderColor: 'rgba(224,137,92,0.4)' }}>Liberar</button>
        </div>
      </div>
    </div>
  );
}
