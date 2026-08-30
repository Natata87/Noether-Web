import React from 'react';
import { Compass, Swords, Sparkles, ChevronRight, Star } from 'lucide-react';
import {
  ENERGY_TREE,
  MAX_BATTLE_ABILITIES,
  getBattleAbilities,
  getEquippedWeapon,
  ZONES
} from '../data/core.js';

export function HubScreen({ character, setActiveTab }) {
  const typeInfo = ENERGY_TREE[character.typeId] || ENERGY_TREE.terra;
  const weapon = getEquippedWeapon(character);
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="panel rounded-2xl p-5 flex flex-col items-center text-center gap-2">
        <Star className="text-gold" size={22} />
        <h2 className="font-display text-lg text-gold">Bem-vindo(a), {character.name}!</h2>
        <p className="text-sm text-muted">{typeInfo.label} · {weapon ? weapon.name : 'Sem arma'} · {getBattleAbilities(character).length}/{MAX_BATTLE_ABILITIES} habilidades equipadas</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveTab('mapa')} className="panel rounded-2xl p-4 flex flex-col items-center gap-2">
          <Compass className="text-gold" size={24} /><span className="font-display text-sm">Explorar</span>
        </button>
        <button onClick={() => setActiveTab('pvp')} className="panel rounded-2xl p-4 flex flex-col items-center gap-2">
          <Swords className="text-gold" size={24} /><span className="font-display text-sm">Duelar</span>
        </button>
      </div>
      <div className="panel rounded-2xl p-4 flex items-center gap-3">
        <div className="medallion" style={{ width: 40, height: 40 }}><Sparkles size={18} className="text-gold" /></div>
        <div className="flex-1">
          <p className="text-sm text-parchment font-semibold">Missão Diária</p>
          <p className="text-tiny text-muted">Derrote 5 criaturas na Floresta Sombria</p>
        </div>
        <ChevronRight size={16} className="text-muted" />
      </div>
    </div>
  );
}

export function ExploreScreen({ onEnter }) {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className="text-xs text-muted uppercase tracking-wide">Escolha uma área</p>
      {ZONES.map((zone) => {
        const Icon = zone.Icon;
        return (
          <button key={zone.id} onClick={() => onEnter(zone)} className="zone-card p-4 flex items-center gap-3 text-left">
            <div className="medallion" style={{ width: 44, height: 44 }}><Icon size={20} className="text-gold" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm text-parchment">{zone.name}</span>
                <span className="tag-pill text-muted">Lv {zone.level}</span>
              </div>
              <p className="text-tiny text-muted mt-1">{zone.desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </button>
        );
      })}
    </div>
  );
}
