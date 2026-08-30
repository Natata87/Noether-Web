import React, { useEffect, useMemo, useState } from 'react';
import {
  Sword, Sparkles, X, Heart, Battery, RotateCcw, Shield, PawPrint,
  Gem, Crown, Footprints, CircleUserRound, ScrollText, Trophy, Swords,
  ChevronRight, LockKeyhole, Palette
} from 'lucide-react';
import {
  ENERGY_TREE,
  xpNeeded,
  hp,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  MAX_BATTLE_ABILITIES,
  getPlayerStats,
  getBattleAbilities,
  getLearnedAbilities,
  getEquippedWeapon,
  FAMILIAR_SPECIES,
  ITEMS,
  RARITY,
} from '../data/core.js';

const PROFILE_TABS = [
  { id: 'status', label: 'Status' },
  { id: 'habilidades', label: 'Habilidades' },
  { id: 'familiar', label: 'Familiar' },
  { id: 'equipamentos', label: 'Equipamentos' },
  { id: 'atributos', label: 'Atributos' },
  { id: 'historico', label: 'Histórico' },
];

const PROFILE_THEMES = [
  { id: 'obsidian', label: 'Obsidiana' },
  { id: 'royal', label: 'Real' },
  { id: 'crimson', label: 'Carmesim' },
  { id: 'ring', label: 'Anel' },
];

const ARMOR_SLOT_META = [
  { id: 'helmet', label: 'Capacete', short: 'CAP', Icon: Crown },
  { id: 'chest', label: 'Peitoral', short: 'PEI', Icon: Shield },
  { id: 'legs', label: 'Calça', short: 'CAL', Icon: CircleUserRound },
  { id: 'boots', label: 'Botas', short: 'BOT', Icon: Footprints },
  { id: 'accessory', label: 'Acessório', short: 'ACE', Icon: Gem },
];

const EQUIPMENT_SLOT_ORDER = [
  { id: 'weapon', label: 'Arma', Icon: Sword },
  ...ARMOR_SLOT_META,
];

const GEAR_BLUEPRINTS = {
  armadura_ferro: {
    slot: 'chest',
    resistances: [
      { label: 'Impacto', value: -12 },
      { label: 'Fogo', value: -6 },
    ],
  },
  elmo_fera: {
    slot: 'helmet',
    resistances: [
      { label: 'Medo', value: -8 },
      { label: 'Sangramento', value: -5 },
    ],
  },
  manto_elfico: {
    slot: 'legs',
    resistances: [
      { label: 'Vento', value: -9 },
      { label: 'Veneno', value: -7 },
    ],
  },
};

function buildArmorLoadout(character) {
  const inventory = character.inventory || {};
  const equipped = {
    helmet: null,
    chest: null,
    legs: null,
    boots: null,
    accessory: null,
  };

  Object.entries(inventory).forEach(([itemId, qty]) => {
    if (!qty || qty <= 0) return;
    const blueprint = GEAR_BLUEPRINTS[itemId];
    const item = ITEMS[itemId];
    if (!blueprint || !item) return;
    if (!equipped[blueprint.slot]) {
      equipped[blueprint.slot] = { id: itemId, ...item, slot: blueprint.slot, resistances: blueprint.resistances };
    }
  });

  return equipped;
}

function buildResistanceList(armorLoadout) {
  const total = new Map();
  Object.values(armorLoadout).forEach((item) => {
    item?.resistances?.forEach((entry) => {
      total.set(entry.label, (total.get(entry.label) || 0) + entry.value);
    });
  });
  return [...total.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function ResourceBar({ label, value, max, kind, Icon, compact = false }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={`profile-resource ${compact ? 'compact' : ''}`}>
      <div className="profile-resource-head">
        <span>{Icon ? <Icon size={13} /> : null}{label}</span>
        <strong>{value} <i>/</i> {max}</strong>
      </div>
      <div className={`profile-resource-track ${kind}`}>
        <div className="profile-resource-fill" style={{ width: `${pct}%` }} />
        <span className="profile-resource-glint" />
      </div>
    </div>
  );
}

function AttributeGrid({ stats, character, spendPoint, editable = true, className = '' }) {
  const canSpend = (character.attributePoints || 0) > 0;
  return (
    <div className={`profile-attribute-grid ${className}`}>
      {ATTRIBUTE_KEYS.map((key) => (
        <div key={key} className="profile-attribute-cell compact-fixed">
          <div className="profile-attribute-copy">
            <span>{ATTRIBUTE_LABELS[key]}</span>
            <strong>{stats[key]}</strong>
          </div>
          {editable && canSpend ? (
            <button
              onClick={() => spendPoint(key)}
              className="profile-attribute-add"
              aria-label={`Adicionar ponto em ${ATTRIBUTE_LABELS[key]}`}
            >+
            </button>
          ) : <span className="profile-attribute-add ghost" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

function CharacterStage({ character, avatar }) {
  return (
    <main className="profile-stage">
      <div className="profile-stage-city" />
      <div className="profile-stage-vignette" />
      <div className="profile-arcane-ring ring-one" />
      <div className="profile-arcane-ring ring-two" />
      <div className="profile-arcane-cross" />
      <div className="profile-stage-floor" />
      <img src={avatar} alt={character.name} className="profile-hero-image" />
      <div className="profile-stage-nameplate">
        <span>PORTADOR DA FREQUÊNCIA</span>
        <h2>{character.name}</h2>
        <p>Visão principal da build</p>
      </div>
    </main>
  );
}

function ActiveFamiliarCard({ character }) {
  const instance = character.familiares?.[0];
  const species = instance ? FAMILIAR_SPECIES[instance.speciesId] : null;
  return (
    <section className="profile-module profile-familiar-card refined-card">
      <div className="profile-module-title">
        <span>FAMILIAR ATIVO</span>
        <PawPrint size={15} />
      </div>
      {instance && species ? (
        <div className="profile-familiar-content">
          <div className="profile-familiar-copy">
            <span className="profile-overline">{species.especie}</span>
            <strong>{instance.nickname || species.name}</strong>
            <p>Nível {instance.level} · Companheiro principal</p>
          </div>
          <div className="profile-familiar-visual">
            <div className="profile-familiar-aura" />
            <img src={species.img} alt={instance.nickname || species.name} />
          </div>
          <div className="profile-familiar-level-line"><span style={{ width: `${Math.min(100, 28 + instance.level * 5)}%` }} /></div>
        </div>
      ) : (
        <div className="profile-empty-module">
          <PawPrint size={30} />
          <strong>Nenhum familiar ativo</strong>
          <p>Capture uma criatura em uma Fissura para preencher este espaço.</p>
        </div>
      )}
    </section>
  );
}

function EquippedAbilities({ abilities, onOpen }) {
  return (
    <section className="profile-module profile-abilities-preview refined-card">
      <div className="profile-module-title">
        <span>HABILIDADES EQUIPADAS</span>
        <button onClick={onOpen}>VER TODAS <ChevronRight size={13} /></button>
      </div>
      <div className="profile-skill-showcase-row">
        {Array.from({ length: MAX_BATTLE_ABILITIES }).map((_, index) => {
          const ability = abilities[index];
          return (
            <button key={ability?.id || `empty-${index}`} onClick={onOpen} className={`profile-skill-showcase ${ability ? 'filled' : 'empty'}`}>
              <div className="profile-skill-showcase-art">
                <div className="profile-skill-showcase-core">
                  {ability ? <Sparkles size={22} /> : <LockKeyhole size={18} />}
                </div>
              </div>
              <div className="profile-skill-showcase-copy">
                <strong>{ability ? ability.name : 'Slot vazio'}</strong>
                <span>{ability ? `Poder ${ability.power}` : 'Disponível'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ResistancePanel({ resistanceList }) {
  return (
    <section className="profile-module profile-resistance-module refined-card">
      <div className="profile-module-title"><span>RESISTÊNCIAS DOS EQUIPAMENTOS</span></div>
      {resistanceList.length ? (
        <div className="profile-resistance-list fancy">
          {resistanceList.map((entry) => (
            <div key={entry.label} className="profile-resistance-row fancy">
              <span>{entry.label}</span>
              <strong>{entry.value}% de dano</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="profile-empty-module resistance-empty">
          <Shield size={26} />
          <strong>Sem resistências extras</strong>
          <p>Equipe armaduras e acessórios para preencher este painel.</p>
        </div>
      )}
    </section>
  );
}

function ArmorPreviewGrid({ armorLoadout, weapon }) {
  return (
    <div className="profile-gear-preview-grid separated">
      {[{ id: 'weapon', label: 'Arma', short: 'ARM', Icon: Sword }, ...ARMOR_SLOT_META].map(({ id, label, short, Icon }) => {
        const item = id === 'weapon' ? weapon : armorLoadout[id];
        const rarityClass = item ? RARITY[item.rarity]?.className : '';
        const image = item?.img;
        return (
          <div key={id} className={`profile-gear-mini-slot ${item ? 'filled' : 'empty'} ${rarityClass}`}>
            <div className="profile-gear-mini-icon sprite-like">
              {image ? <img src={image} alt={item.name} /> : <Icon size={21} />}
            </div>
            <div className="profile-gear-mini-copy">
              <span>{short}</span>
              <strong>{item ? item.name : label}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProfileModal({ character, avatar, onUpdateCharacter, onClose, onReset }) {
  const [tab, setTab] = useState('status');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'obsidian';
    return window.localStorage.getItem('noether_profile_theme') || 'obsidian';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('noether_profile_theme', theme);
  }, [theme]);

  const stats = getPlayerStats(character);
  const typeInfo = ENERGY_TREE[character.typeId] || ENERGY_TREE.terra;
  const need = xpNeeded(character.level);
  const weapon = getEquippedWeapon(character);
  const abilities = getBattleAbilities(character);
  const learned = getLearnedAbilities(character);
  const armorLoadout = useMemo(() => buildArmorLoadout(character), [character]);
  const resistanceList = useMemo(() => buildResistanceList(armorLoadout), [armorLoadout]);

  function spendPoint(key) {
    if ((character.attributePoints || 0) <= 0) return;
    const nextAlloc = { ...(character.attributeAllocations || {}), [key]: (character.attributeAllocations?.[key] || 0) + 1 };
    const draft = { ...character, attributeAllocations: nextAlloc, attributePoints: character.attributePoints - 1 };
    const nextStats = getPlayerStats(draft);
    const nextMaxHp = hp(nextStats.vit);
    const hpGain = Math.max(0, nextMaxHp - character.maxHp);
    onUpdateCharacter({ ...draft, maxHp: nextMaxHp, hp: Math.min(nextMaxHp, character.hp + hpGain) });
  }

  const renderStatus = () => (
    <div className="profile-status-layout">
      <aside className="profile-status-left">
        <section className="profile-identity-block refined-card">
          <div className="profile-frequency-emblem"><span>{typeInfo.label?.slice(0, 1) || 'N'}</span></div>
          <div>
            <span className="profile-overline">FREQUÊNCIA</span>
            <h1>{typeInfo.label}</h1>
            <p>Categoria {typeInfo.group === 'beta' ? 'Beta β' : 'Gama Γ'} · Fileira {typeInfo.tier}</p>
          </div>
        </section>

        <section className="profile-level-block refined-card">
          <div className="profile-level-title"><span>NÍVEL</span><strong>{character.level}</strong></div>
          <ResourceBar label="XP" value={character.xp} max={need} kind="xp" compact />
        </section>

        <section className="profile-resource-panel refined-card">
          <ResourceBar label="HP" value={character.hp} max={character.maxHp} kind="hp" Icon={Heart} />
          <ResourceBar label="RD" value={stats.rd} max={stats.rd} kind="rd" Icon={Battery} />
        </section>

        <section className="profile-points-strip refined-card">
          <div><span>PONTOS LIVRES</span><p>Distribua fora de combate</p></div>
          <strong>{character.attributePoints || 0}</strong>
        </section>

        <div className="profile-lower-panels separated-blocks">
          <section className="profile-module profile-attributes-mini refined-card">
            <div className="profile-module-title">
              <span>ATRIBUTOS</span>
              <button onClick={() => setTab('atributos')}>DETALHES <ChevronRight size={13} /></button>
            </div>
            <AttributeGrid stats={stats} character={character} spendPoint={spendPoint} editable className="compact tight" />
          </section>

          <section className="profile-module profile-equip-preview refined-card">
            <div className="profile-module-title">
              <span>EQUIPAMENTOS</span>
              <button onClick={() => setTab('equipamentos')}>VER TUDO <ChevronRight size={13} /></button>
            </div>
            <ArmorPreviewGrid armorLoadout={armorLoadout} weapon={weapon} />
          </section>
        </div>
      </aside>

      <CharacterStage character={character} avatar={avatar} />

      <aside className="profile-status-right">
        <ActiveFamiliarCard character={character} />
        <EquippedAbilities abilities={abilities} onOpen={() => setTab('habilidades')} />
        <ResistancePanel resistanceList={resistanceList} />
      </aside>
    </div>
  );

  const renderAbilities = () => (
    <div className="profile-detail-layout">
      <aside className="profile-detail-sidebar">
        <span className="profile-overline">ARSENAL ENERGÉTICO</span>
        <h2>Habilidades</h2>
        <p>Você pode aprender várias manifestações, mas leva no máximo {MAX_BATTLE_ABILITIES} para cada combate.</p>
        <div className="profile-detail-number"><strong>{abilities.length}</strong><span>equipadas</span></div>
        <div className="profile-detail-number"><strong>{learned.length}</strong><span>aprendidas</span></div>
      </aside>
      <section className="profile-detail-main">
        <div className="profile-detail-heading"><div><span>LOADOUT ATUAL</span><h3>Habilidades equipadas</h3></div><strong>{abilities.length}/{MAX_BATTLE_ABILITIES}</strong></div>
        <div className="profile-ability-cards ornate">
          {abilities.map((ability, index) => (
            <article className="profile-ability-card ornate" key={ability.id}>
              <div className="profile-ability-card-top">
                <div className="profile-ability-orb ornate"><Sparkles size={27} /></div>
                <div className="profile-ability-info">
                  <span>{ENERGY_TREE[ability.energiaId]?.label || (ability.categoria === 'fisica' ? 'Física' : 'Híbrida')}</span>
                  <h4>{ability.name}</h4>
                  <p>{ability.desc || 'Manifestação energética preparada para combate.'}</p>
                </div>
                <div className="profile-ability-index">0{index + 1}</div>
              </div>
              <div className="profile-ability-card-bottom">
                <div className="profile-ability-stats"><span>PODER</span><strong>{ability.power}</strong></div>
                <div className="profile-ability-stats"><span>RD</span><strong>{ability.rdCost || 0}</strong></div>
                <div className="profile-ability-stats"><span>CATEGORIA</span><strong>{ability.categoria}</strong></div>
              </div>
            </article>
          ))}
        </div>
        <div className="profile-learned-strip">
          <span>APRENDIDAS</span>
          <div>{learned.map((ability) => <span key={ability.id} className={abilities.some((a) => a.id === ability.id) ? 'active' : ''}>{ability.name}</span>)}</div>
        </div>
      </section>
    </div>
  );

  const renderFamiliar = () => {
    const instance = character.familiares?.[0];
    const species = instance ? FAMILIAR_SPECIES[instance.speciesId] : null;
    return (
      <div className="profile-detail-layout">
        <aside className="profile-detail-sidebar">
          <span className="profile-overline">COMPANHEIRO</span>
          <h2>Familiar</h2>
          <p>Criaturas capturadas podem acompanhar sua jornada e formar uma camada própria da build.</p>
          <div className="profile-detail-number"><strong>{character.familiares?.length || 0}</strong><span>capturados</span></div>
        </aside>
        <section className="profile-familiar-page">
          {instance && species ? (
            <>
              <div className="profile-familiar-page-art"><div className="profile-familiar-page-ring" /><img src={species.img} alt={instance.nickname || species.name} /></div>
              <div className="profile-familiar-page-copy">
                <span className="profile-overline">FAMILIAR ATIVO · NÍVEL {instance.level}</span>
                <h3>{instance.nickname || species.name}</h3>
                <p className="profile-familiar-species">{species.especie} · Companheiro da build</p>
                <p>{species.sobre}</p>
                <div className="profile-familiar-passive"><span>PASSIVA</span><strong>{species.passiva?.name || '—'}</strong><p>{species.passiva?.desc || 'Nenhuma passiva cadastrada.'}</p></div>
              </div>
            </>
          ) : <div className="profile-big-empty"><PawPrint size={54} /><h3>Nenhum familiar ativo</h3><p>Explore Fissuras para encontrar criaturas.</p></div>}
        </section>
      </div>
    );
  };

  const renderEquipment = () => (
    <div className="profile-detail-layout">
      <aside className="profile-detail-sidebar">
        <span className="profile-overline">LOADOUT</span>
        <h2>Equipamentos</h2>
        <p>Estrutura preparada para equipamentos por parte do corpo, incluindo armaduras separadas por slot e molduras de raridade.</p>
        <div className="profile-detail-number"><strong>{weapon ? 1 : 0}</strong><span>arma equipada</span></div>
        <div className="profile-detail-number"><strong>{Object.values(armorLoadout).filter(Boolean).length}</strong><span>peças visíveis</span></div>
      </aside>
      <section className="profile-equipment-page refined">
        <div className="profile-equipment-figure"><CharacterStage character={character} avatar={avatar} /></div>
        <div className="profile-equipment-grid refined">
          {EQUIPMENT_SLOT_ORDER.map(({ id, label, Icon }) => {
            const item = id === 'weapon' ? weapon : armorLoadout[id];
            const rarityClass = item ? RARITY[item.rarity]?.className : '';
            return (
              <div className={`profile-equipment-slot ${item ? 'equipped' : ''} ${rarityClass}`} key={id}>
                <div className="profile-equipment-slot-icon"><Icon size={24} /></div>
                <div>
                  <span>{label}</span>
                  <strong>{item?.name || 'Slot vazio'}</strong>
                  <p>{item ? (id === 'weapon' ? 'Arma ativa da build' : 'Peça equipada com moldura por raridade') : 'Preparado para o sistema completo de equipamento'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderAttributes = () => (
    <div className="profile-detail-layout">
      <aside className="profile-detail-sidebar">
        <span className="profile-overline">PROGRESSÃO</span>
        <h2>Atributos</h2>
        <p>Distribua os pontos ganhos ao subir de nível. O botão de adicionar só aparece quando houver pontos disponíveis.</p>
        <div className="profile-detail-number gold"><strong>{character.attributePoints || 0}</strong><span>pontos disponíveis</span></div>
      </aside>
      <section className="profile-attributes-page">
        <div className="profile-detail-heading"><div><span>STATUS COMPLETO</span><h3>Atributos do personagem</h3></div></div>
        <AttributeGrid stats={stats} character={character} spendPoint={spendPoint} editable className="large" />
      </section>
    </div>
  );

  const renderHistory = () => (
    <div className="profile-detail-layout">
      <aside className="profile-detail-sidebar">
        <span className="profile-overline">REGISTRO</span>
        <h2>Histórico</h2>
        <p>Resumo persistente do personagem. Novos registros serão adicionados conforme campanhas, conquistas e multiplayer evoluírem.</p>
      </aside>
      <section className="profile-history-page">
        <article><Trophy size={28} /><span>VITÓRIAS PVP</span><strong>{character.pvpWins || 0}</strong></article>
        <article><Swords size={28} /><span>DERROTAS PVP</span><strong>{character.pvpLosses || 0}</strong></article>
        <article><PawPrint size={28} /><span>FAMILIARES</span><strong>{character.familiares?.length || 0}</strong></article>
        <article><ScrollText size={28} /><span>NÍVEL ATUAL</span><strong>{character.level}</strong></article>
        <article className="history-reset-card"><RotateCcw size={28} /><span>RECOMEÇAR</span><strong>Resetar personagem</strong><button onClick={onReset}>Recomeçar build</button></article>
      </section>
    </div>
  );

  return (
    <div className={`profile-fullscreen theme-${theme}`} role="dialog" aria-modal="true" aria-label="Perfil e Build">
      <div className="profile-ornament top-left" /><div className="profile-ornament top-right" />
      <header className="profile-main-header">
        <button className="profile-logo" onClick={() => setTab('status')} aria-label="Voltar ao Status">
          <span className="profile-logo-mark">N</span><strong>NOETHER</strong>
        </button>
        <nav className="profile-tabs" aria-label="Seções do perfil">
          {PROFILE_TABS.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={tab === item.id ? 'active' : ''}>{item.label}</button>
          ))}
        </nav>
        <div className="profile-header-actions">
          <div className="profile-theme-switcher" aria-label="Alternar paleta">
            <Palette size={15} />
            {PROFILE_THEMES.map((item) => (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={theme === item.id ? 'active' : ''}
                aria-pressed={theme === item.id}
                title={`Usar paleta ${item.label}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button className="profile-full-close" onClick={onClose} aria-label="Fechar perfil" title="Fechar perfil"><X size={20} /></button>
        </div>
      </header>

      <div className="profile-content-frame no-footer">
        {tab === 'status' && renderStatus()}
        {tab === 'habilidades' && renderAbilities()}
        {tab === 'familiar' && renderFamiliar()}
        {tab === 'equipamentos' && renderEquipment()}
        {tab === 'atributos' && renderAttributes()}
        {tab === 'historico' && renderHistory()}
      </div>
    </div>
  );
}
