import React, { useState } from 'react';
import { Sword } from 'lucide-react';
import {
  ENERGY_TREE,
  custoRD,
  MAX_BATTLE_ABILITIES,
  getTypeAbilityPool,
  getLearnedAbilities,
  getEquippedWeapon,
  RARITY,
  ITEMS,
  ITEM_CATEGORIES,
  RECIPES,
  craftItem
} from '../data/core.js';

export function InventoryScreen({ character, onUpdateCharacter, showToast }) {
  const [section, setSection] = useState('inventario');
  const [cat, setCat] = useState('arma');
  const inv = character.inventory || {};
  const learned = getLearnedAbilities(character);
  const equippedSet = new Set(character.equippedAbilityIds || []);
  const weapon = getEquippedWeapon(character);

  function doCraft(recipe) {
    const canDo = recipe.materials.every((m) => (inv[m.item] || 0) >= m.qty);
    if (!canDo) return;
    const nextInv = craftItem(inv, recipe);
    onUpdateCharacter({ ...character, inventory: nextInv });
    showToast(`${ITEMS[recipe.result].name} criado(a)!`);
  }

  function equipWeapon(id) {
    if (!(inv[id] > 0) || ITEMS[id]?.category !== 'arma') return;
    onUpdateCharacter({ ...character, equippedWeaponId: id });
    showToast(`${ITEMS[id].name} equipada!`);
  }

  function toggleBattleAbility(id) {
    const current = character.equippedAbilityIds || [];
    if (current.includes(id)) {
      onUpdateCharacter({ ...character, equippedAbilityIds: current.filter((x) => x !== id) });
      return;
    }
    if (current.length >= MAX_BATTLE_ABILITIES) { showToast(`Você só pode levar ${MAX_BATTLE_ABILITIES} habilidades.`); return; }
    onUpdateCharacter({ ...character, equippedAbilityIds: [...current, id] });
  }

  function studyBook(itemId) {
    if (!(inv[itemId] > 0)) return;
    const known = new Set(character.learnedAbilityIds || []);
    const candidates = getTypeAbilityPool(character.typeId).filter((a) => !known.has(a.id));
    if (!candidates.length) { showToast('Você já aprendeu todas as habilidades disponíveis deste Tipo.'); return; }
    const learnedAbility = candidates[0];
    const nextInv = { ...inv, [itemId]: inv[itemId] - 1 };
    const nextLearned = [...(character.learnedAbilityIds || []), learnedAbility.id];
    onUpdateCharacter({ ...character, inventory: nextInv, learnedAbilityIds: nextLearned });
    showToast(`Aprendeu ${learnedAbility.name}!`);
  }

  const ownedItems = Object.entries(ITEMS).filter(([id, it]) => it.category === cat && (inv[id] || 0) > 0);
  const ownedWeapons = Object.entries(ITEMS).filter(([id, it]) => it.category === 'arma' && (inv[id] || 0) > 0);
  const catRecipes = RECIPES.filter((r) => ITEMS[r.result].category === cat);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setSection('inventario')} className={`btn-secondary ${section !== 'inventario' ? 'opacity-50' : ''}`}>Inventário</button>
        <button onClick={() => setSection('build')} className={`btn-secondary ${section !== 'build' ? 'opacity-50' : ''}`}>Build</button>
        <button onClick={() => setSection('craft')} className={`btn-secondary ${section !== 'craft' ? 'opacity-50' : ''}`}>Craft</button>
      </div>

      {section !== 'build' && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {ITEM_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`cat-pill ${cat === c.id ? 'cat-pill-active' : ''}`}>{c.label}</button>
          ))}
        </div>
      )}

      {section === 'build' ? (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2"><p className="text-xs text-muted uppercase tracking-wide">Arma equipada</p><span className="energy-badge">{weapon ? ENERGY_TREE[weapon.energiaId]?.label : 'Sem Tipo'}</span></div>
            <div className="panel rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Sword size={24} className="text-gold" />
                <div className="flex-1"><p className="text-sm text-parchment font-semibold">{weapon?.name || 'Sem arma'}</p><p className="text-tiny text-muted">Ataque básico grátis + 2 golpes exclusivos.</p></div>
              </div>
              {weapon && <div className="flex flex-col gap-1 mt-3">{weapon.attacks.map((a) => <span key={a.id} className="text-tiny text-muted">• {a.name} · Poder {a.power} · {custoRD(a, character.typeId)} RD</span>)}</div>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ownedWeapons.map(([id, it]) => (
                <button key={id} onClick={() => equipWeapon(id)} className={`item-card p-3 text-left ${character.equippedWeaponId === id ? 'class-card-selected' : ''}`}>
                  <div className="flex items-center gap-2"><it.Icon size={18} className="text-gold" /><span className="text-xs text-parchment font-semibold">{it.name}</span></div>
                  <p className="text-tiny text-muted mt-1">{ENERGY_TREE[it.energiaId]?.label} · Básico {it.basicPower}</p>
                  <p className="text-tiny text-gold mt-1">{character.equippedWeaponId === id ? 'Equipada' : 'Equipar'}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2"><p className="text-xs text-muted uppercase tracking-wide">Habilidades de batalha</p><span className="text-tiny text-gold">{(character.equippedAbilityIds || []).length}/{MAX_BATTLE_ABILITIES}</span></div>
            <div className="flex flex-col gap-2">
              {learned.map((a) => {
                const equipped = equippedSet.has(a.id);
                return (
                  <button key={a.id} onClick={() => toggleBattleAbility(a.id)} className={`panel rounded-xl p-3 text-left ${equipped ? 'class-card-selected' : ''}`}>
                    <div className="flex items-center justify-between"><span className="text-sm text-parchment font-semibold">{a.name}</span><span className="tag-pill text-muted">{equipped ? 'Equipada' : 'Aprendida'}</span></div>
                    <p className="text-tiny text-muted mt-1">{a.desc}</p>
                    <p className="text-tiny text-gold mt-1">{custoRD(a, character.typeId)} RD</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : section === 'inventario' ? (
        ownedItems.length === 0 ? (
          <div className="panel rounded-2xl p-4 text-center"><p className="text-sm text-muted">Você ainda não tem nenhum item nessa categoria.</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {ownedItems.map(([id, it]) => {
              const qty = Math.min(999, inv[id] || 0);
              const rarity = RARITY[it.rarity];
              return (
                <div key={id} className={`item-card ${rarity.className} p-3 flex flex-col items-center text-center gap-1 relative`}>
                  <div className="qty-badge">{qty}</div>
                  {it.img ? <img src={it.img} alt={it.name} style={{ width: 40, height: 40, objectFit: 'contain' }} /> : <it.Icon size={22} className="text-gold" />}
                  <span className="text-xs text-parchment font-semibold">{it.name}</span>
                  <span className="tag-pill text-muted">{rarity.label}</span>
                  {it.category === 'arma' && <button onClick={() => equipWeapon(id)} className="btn-secondary mt-1" style={{ padding: '5px 9px' }}>{character.equippedWeaponId === id ? 'Equipada' : 'Equipar'}</button>}
                  {it.category === 'livro' && <button onClick={() => studyBook(id)} className="btn-secondary mt-1" style={{ padding: '5px 9px' }}>Estudar</button>}
                </div>
              );
            })}
          </div>
        )
      ) : catRecipes.length === 0 ? (
        <div className="panel rounded-2xl p-4 text-center"><p className="text-sm text-muted">Nenhuma receita nessa categoria ainda.</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {catRecipes.map((r) => {
            const result = ITEMS[r.result];
            const rarity = RARITY[result.rarity];
            const canDo = r.materials.every((m) => (inv[m.item] || 0) >= m.qty);
            return (
              <div key={r.id} className="panel rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {result.img ? <img src={result.img} alt={result.name} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <result.Icon size={24} className="text-gold" />}
                  <div className="flex-1"><p className="text-sm text-parchment font-semibold">{result.name}</p><span className="tag-pill text-muted">{rarity.label}</span></div>
                  <button disabled={!canDo} onClick={() => doCraft(r)} className="btn-secondary" style={!canDo ? { opacity: 0.4 } : {}}>Craftar</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {r.materials.map((m) => { const have = inv[m.item] || 0; const ok = have >= m.qty; return <span key={m.item} className="tag-pill" style={{ color: ok ? '#8fe0a8' : '#e0895c' }}>{ITEMS[m.item].name} {have}/{m.qty}</span>; })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
