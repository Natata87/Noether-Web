import React, { useEffect, useState } from 'react';
import { Sparkles, Coins, Heart, Star, Zap } from 'lucide-react';
import {
  ENERGY_TREE, xpNeeded, hp, PLAYER_BASE_STATS, TYPE_IDS, DEFAULT_WEAPON_ID,
  typeAvatarStyle, avatarForCharacter, getPlayerStats, getTypeAbilityPool,
  migrateCharacter, STARTER_INVENTORY, NAV_ITEMS
} from './data/core.js';
import { HubScreen } from './screens/HomeScreens.jsx';
import { BattleScreen } from './screens/BattleScreens.jsx';
import { ProfileModal } from './screens/ProfileScreen.jsx';
import { InventoryScreen } from './screens/InventoryScreen.jsx';
import { ShopScreen, PvPScreen } from './screens/ShopPvPScreens.jsx';
import { MapScreen } from './screens/MapScreen.jsx';
import { FissuraScreen } from './screens/FissuraScreen.jsx';
import { CreaturesScreen, FamiliarDetailScreen } from './screens/CreatureScreens.jsx';
import { PvPBattleScreen } from './screens/PvPBattleScreen.jsx';
import './styles/game.css';

export default function RPGGame() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inicio');
  const [name, setName] = useState('');
  const [rolledType, setRolledType] = useState(null);
  const [starterAbilityIds, setStarterAbilityIds] = useState([]);
  const [gender, setGender] = useState('m');
  const [shopTab, setShopTab] = useState('loja');
  const [inBattleZone, setInBattleZone] = useState(null);
  const [inFissura, setInFissura] = useState(false);
  const [pvpOpponent, setPvpOpponent] = useState(null);
  const [viewingFamiliar, setViewingFamiliar] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get('character', false);
        if (result && result.value) setCharacter(migrateCharacter(JSON.parse(result.value)));
      } catch (e) {
        // sem personagem salvo ainda
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (character) window.storage.set('character', JSON.stringify(character), false).catch(() => {});
  }, [character]);

  const handleRollType = () => {
    if (rolledType) return;
    const typeId = TYPE_IDS[Math.floor(Math.random() * TYPE_IDS.length)];
    setRolledType(typeId);
    setStarterAbilityIds([]);
  };

  const toggleStarterAbility = (abilityId) => {
    setStarterAbilityIds((current) => {
      if (current.includes(abilityId)) return current.filter((id) => id !== abilityId);
      if (current.length >= 2) return current;
      return [...current, abilityId];
    });
  };

  const handleCreate = () => {
    if (!name.trim() || !rolledType || starterAbilityIds.length !== 2) return;
    const draft = {
      name: name.trim(),
      gender,
      typeId: rolledType,
      avatarStyle: typeAvatarStyle(rolledType),
      baseStats: { ...PLAYER_BASE_STATS },
      attributeAllocations: {},
      attributePoints: 0,
      learnedAbilityIds: [...starterAbilityIds],
      equippedAbilityIds: [...starterAbilityIds],
      equippedWeaponId: DEFAULT_WEAPON_ID,
      level: 0,
      xp: 0,
      sc: 50,
      inventory: { ...STARTER_INVENTORY },
      familiares: [],
      pvpWins: 0,
      pvpLosses: 0,
    };
    const lvl0Stats = getPlayerStats(draft);
    setCharacter({ ...draft, hp: hp(lvl0Stats.vit), maxHp: hp(lvl0Stats.vit) });
  };

  const handleReset = async () => {
    try { await window.storage.delete('character', false); } catch (e) {}
    setShowProfile(false);
    setName('');
    setRolledType(null);
    setStarterAbilityIds([]);
    setCharacter(null);
  };

  if (loading) {
    return (
      <>
<div className="app-bg w-full h-screen flex items-center justify-center">
          <div className="medallion" style={{ width: 56, height: 56 }}><Star size={26} className="text-gold" /></div>
        </div>
      </>
    );
  }

  if (!character) {
    return (
      <>
<div className="app-bg w-full h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md panel rounded-3xl p-6 flex flex-col gap-5 max-h-full overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="medallion" style={{ width: 56, height: 56 }}><Star size={26} className="text-gold" /></div>
              <h1 className="font-display text-2xl text-gold text-center">Crie seu Herói</h1>
              <p className="text-sm text-muted text-center">Sua jornada em busca das Sabrina Crowns está prestes a começar</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-wide">Nome do personagem</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite um nome..." maxLength={16} className="input-field" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-wide">Gênero do personagem</label>
              <div className="flex gap-2">
                <button onClick={() => setGender('m')} className={`gender-btn ${gender === 'm' ? 'gender-btn-selected' : ''}`}>Masculino</button>
                <button onClick={() => setGender('f')} className={`gender-btn ${gender === 'f' ? 'gender-btn-selected' : ''}`}>Feminino</button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-wide">Tipo de nascimento</label>
              {!rolledType ? (
                <button onClick={handleRollType} className="panel rounded-2xl p-5 flex flex-col items-center gap-2">
                  <Sparkles size={24} className="text-gold" />
                  <span className="font-display text-sm text-gold">Rolar Tipo</span>
                  <span className="text-tiny text-muted text-center">Seu Tipo é aleatório e define sua árvore de habilidades.</span>
                </button>
              ) : (
                <div className="panel rounded-2xl p-4 flex items-center gap-3">
                  <div className="medallion" style={{ width: 42, height: 42 }}><Zap size={18} className="text-gold" /></div>
                  <div className="flex-1">
                    <p className="text-tiny text-muted uppercase tracking-wide">Tipo sorteado</p>
                    <p className="font-display text-lg text-gold">{ENERGY_TREE[rolledType].label}</p>
                  </div>
                  <span className="tag-pill text-muted">Fileira {ENERGY_TREE[rolledType].tier + 1}</span>
                </div>
              )}
            </div>

            {rolledType && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted uppercase tracking-wide">Escolha 2 habilidades iniciais</label>
                  <span className="text-tiny text-gold">{starterAbilityIds.length}/2</span>
                </div>
                <div className="flex flex-col gap-2">
                  {getTypeAbilityPool(rolledType).map((a) => {
                    const selected = starterAbilityIds.includes(a.id);
                    return (
                      <button key={a.id} onClick={() => toggleStarterAbility(a.id)} className={`class-card ${selected ? 'class-card-selected' : ''}`}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-display text-sm text-parchment">{a.name}</span>
                          <span className="tag-pill text-muted">Poder {a.power}</span>
                        </div>
                        <span className="text-tiny text-muted mt-1 leading-snug">{a.desc}</span>
                        <span className="text-tiny text-gold mt-1">{a.categoria === 'fisica' ? 'Física' : a.categoria === 'hibrida' ? 'Híbrida' : ENERGY_TREE[a.energiaId]?.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={handleCreate} disabled={!name.trim() || !rolledType || starterAbilityIds.length !== 2} className="btn-primary">Começar Jornada</button>
          </div>
        </div>
      </>
    );
  }

  const avatar = avatarForCharacter(character);
  const typeInfo = ENERGY_TREE[character.typeId] || ENERGY_TREE.terra;

  if (inBattleZone) {
    return (
      <>
<BattleScreen character={character} avatar={avatar} zone={inBattleZone} onUpdateCharacter={setCharacter} onEnd={() => setInBattleZone(null)} />
      </>
    );
  }

  if (inFissura) {
    return (
      <>
<FissuraScreen character={character} onUpdateCharacter={setCharacter} onEnd={() => setInFissura(false)} />
      </>
    );
  }

  if (pvpOpponent) {
    return (
      <>
<PvPBattleScreen character={character} avatar={avatar} opponent={pvpOpponent} onUpdateCharacter={setCharacter} onEnd={() => setPvpOpponent(null)} />
      </>
    );
  }

  return (
    <>
<div className="app-bg w-full h-screen flex items-center justify-center relative">
        <div className="desktop-shell overflow-hidden">
          <div className="header-bar desktop-header flex items-center gap-5">
            <button onClick={() => setShowProfile(true)} className="flex items-center gap-4 flex-1 text-left min-w-0">
              <div className="medallion" style={{ width: 54, height: 54, overflow: 'hidden' }}>
                <img src={avatar} alt={character.name} style={{ height: '118%' }} />
                <div className="level-badge">{character.level}</div>
              </div>
              <div className="min-w-0">
                <div className="desktop-player-meta">Personagem · Frequência {typeInfo.label}</div>
                <div className="font-display text-base text-parchment desktop-player-name truncate">{character.name}</div>
              </div>
            </button>
            <div className="desktop-header-resources">
              <div className="header-resource">
                <div className="header-resource-top"><span>HP</span><strong>{character.hp}/{character.maxHp}</strong></div>
                <div className="bar-track"><div className="bar-fill-hp" style={{ width: `${Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100))}%` }} /></div>
              </div>
              <div className="header-resource">
                <div className="header-resource-top"><span>XP</span><strong>{character.xp}/{xpNeeded(character.level)}</strong></div>
                <div className="bar-track"><div className="bar-fill-exp" style={{ width: `${Math.min(100, (character.xp / xpNeeded(character.level)) * 100)}%` }} /></div>
              </div>
              <div className="header-currency"><Coins size={16}/><span>{character.sc}</span></div>
            </div>
          </div>

          <div className="game-content no-scrollbar">
            {activeTab === 'inicio' && <HubScreen character={character} setActiveTab={setActiveTab} />}
            {activeTab === 'mapa' && <MapScreen onEnterZone={setInBattleZone} onEnterFissura={() => setInFissura(true)} />}
            {activeTab === 'inventario' && <InventoryScreen character={character} onUpdateCharacter={setCharacter} showToast={showToast} />}
            {activeTab === 'criaturas' && <CreaturesScreen character={character} setActiveTab={setActiveTab} onSelect={setViewingFamiliar} />}
            {activeTab === 'loja' && <ShopScreen shopTab={shopTab} setShopTab={setShopTab} character={character} onUpdateCharacter={setCharacter} showToast={showToast} />}
            {activeTab === 'pvp' && <PvPScreen character={character} avatar={avatar} onChallenge={setPvpOpponent} showToast={showToast} />}
          </div>

          <div className="bottom-nav flex px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.Icon;
              const active = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`nav-btn ${active ? 'nav-btn-active' : ''}`}>
                  <Icon size={20} /><span className="text-tiny">{item.label}</span>{active && <div className="nav-indicator" />}
                </button>
              );
            })}
          </div>
        </div>

        {showProfile && <ProfileModal character={character} avatar={avatar} onUpdateCharacter={setCharacter} onClose={() => setShowProfile(false)} onReset={handleReset} />}
        {viewingFamiliar && <FamiliarDetailScreen instance={viewingFamiliar} character={character} onUpdateCharacter={setCharacter} onClose={() => setViewingFamiliar(null)} />}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
