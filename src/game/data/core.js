import {
  Home, Compass, Package, PawPrint, Store, Swords,
  Shield, Sword, Flame, Droplets, TreePine, Landmark,
  Sparkles, X, Gem, Axe, Zap
} from 'lucide-react';
import { ASSETS } from './assets.js';

export const ENERGY_TREE = {
  ceu: { label: 'Céu', tier: 0, group: 'gama', apice: true },
  cosmica: { label: 'Cósmica', tier: 0, group: 'gama', apice: true },
  termica: { label: 'Térmica', tier: 1, group: 'gama' },
  nuclear: { label: 'Nuclear', tier: 1, group: 'gama' },
  amor: { label: 'Amor', tier: 2, group: 'gama' },
  juramento: { label: 'Juramento', tier: 2, group: 'gama' },
  medo: { label: 'Medo', tier: 2, group: 'gama' },
  odio: { label: 'Ódio', tier: 2, group: 'gama' },
  agua: { label: 'Água', tier: 3, group: 'beta' },
  terra: { label: 'Terra', tier: 3, group: 'beta' },
  vento: { label: 'Vento', tier: 3, group: 'beta' },
};

export function typeMultiplier(atkEnergyId, defEnergyId) {
  if (!atkEnergyId || !defEnergyId) return 1.0;
  const a = ENERGY_TREE[atkEnergyId], d = ENERGY_TREE[defEnergyId];
  const diff = d.tier - a.tier;
  if (diff === 0) return 1.0;
  let mult;
  if (diff > 0) mult = diff === 1 ? 1.20 : diff === 2 ? 1.40 : 1.60;
  else { const up = -diff; mult = up === 1 ? 0.85 : up === 2 ? 0.70 : 0.55; }
  if (a.apice && mult < 1.0) return 1.0;
  return mult;
}

export function custoRD(ability, casterEnergiaId) {
  if (!ability) return 0;
  if (ability.rdCost != null) return Math.max(0, ability.rdCost);
  if (ability.categoria === 'fisica') return 0;
  const base = Math.ceil(ability.power / 3);
  const info = ENERGY_TREE[ability.energiaId];
  let mult = 1;
  if (info?.apice) mult += 0.20;
  if (info?.group === 'beta' && ability.energiaId === casterEnergiaId) mult -= 0.20;
  return Math.max(1, Math.round(base * mult));
}

export function precisaoPenaltyApice(ability, casterEnergiaId) {
  return (ability.energiaId === casterEnergiaId && ENERGY_TREE[casterEnergiaId]?.apice) ? 0.95 : 1.0;
}

export function xpNeeded(level) { return level === 0 ? 30 : Math.round(100 * Math.pow(level, 1.5)); }

export const TIER_MULT = {
  comum: { hp: 0.5, atk: 0.6 },
  elite: { hp: 2.0, atk: 1.05 },
  minichefe: { hp: 7.5, atk: 1.45 },
  boss: { hp: 15.0, atk: 1.75 },
};
export const TIER_LABELS = { comum: 'Comum', elite: 'Elite', minichefe: 'Mini-chefe', boss: 'Boss' };

export function hp(vit) { return vit * 3; }

export function pickEnemyTemplate(zoneId) {
  const pool = ENEMIES[zoneId] || ENEMIES[1];
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  let chosen = pool[0];
  for (const e of pool) { if (roll < e.weight) { chosen = e; break; } roll -= e.weight; }
  return { ...chosen };
}
export const SC_VALUE = { comum: 8, elite: 25, minichefe: 60, boss: 150 };
export function enemySc(tier) { return SC_VALUE[tier]; }

export function gerarInimigo(template, playerLeveledStats) {
  const t = TIER_MULT[template.tier];
  const stats = {
    vit: Math.round(playerLeveledStats.vit * t.hp),
    atf: Math.round(playerLeveledStats.atf * t.atk),
    ate: 0,
    def: Math.round(playerLeveledStats.def * t.hp),
    bld: Math.round(playerLeveledStats.bld * t.hp),
    spd: template.spd,
    acc: template.acc,
    crt: template.crt,
    crd: template.crd,
  };
  const instance = { ...template, stats };
  const dropRoll = Math.random() < (template.dropChance || 0);
  instance.drop = dropRoll ? (typeof template.drop === 'function' ? template.drop() : template.drop) : null;
  return instance;
}

export const CLASSES = [
  {
    id: 'guerreiro', name: 'Guerreiro', desc: 'Resistente na linha de frente.',
    avatarM: ASSETS.AVATAR_GUERREIRO_M, avatarF: ASSETS.AVATAR_GUERREIRO_F,
    energia: 'terra',
    stats: { vit: 35, atf: 5, ate: 2, def: 144, bld: 120, spd: 13, acc: 85, crt: 25, crd: 20, rd: 50 },
    ability: 'Investida Brutal',
  },
  {
    id: 'mago', name: 'Mago', desc: 'Magias devastadoras à distância.',
    avatarM: ASSETS.AVATAR_MAGO_M, avatarF: ASSETS.AVATAR_MAGO_F,
    energia: 'termica',
    stats: { vit: 26, atf: 2, ate: 6, def: 122, bld: 140, spd: 15, acc: 88, crt: 30, crd: 25, rd: 100 },
    ability: 'Bola de Fogo',
  },
  {
    id: 'arqueiro', name: 'Arqueiro', desc: 'Precisão letal, críticos frequentes.',
    avatarM: ASSETS.AVATAR_ARQUEIRO_M, avatarF: ASSETS.AVATAR_ARQUEIRO_F,
    energia: 'vento',
    stats: { vit: 27, atf: 5, ate: 2, def: 128, bld: 120, spd: 20, acc: 95, crt: 50, crd: 30, rd: 65 },
    ability: 'Tiro Certeiro',
  },
  {
    id: 'assassino', name: 'Assassino', desc: 'Rápido e furtivo, ataca primeiro.',
    avatarM: ASSETS.AVATAR_ASSASSINO_M, avatarF: ASSETS.AVATAR_ASSASSINO_F,
    energia: 'medo',
    stats: { vit: 26, atf: 5, ate: 2, def: 124, bld: 118, spd: 24, acc: 92, crt: 42, crd: 28, rd: 60 },
    ability: 'Golpe das Sombras',
  },
];

export const ABILITIES = {
  guerreiro: [
    { id: 'investida', name: 'Investida Brutal', categoria: 'fisica', power: 45,
      effect: { type: 'atordoado', chance: 0.25, duration: 1 },
      desc: '25% de chance de atordoar o inimigo por 1 turno.' },
    { id: 'revidar', name: 'Revidar', categoria: 'fisica', power: 0, isRevidar: true,
      desc: 'Sofre o próximo golpe e revida com 160% do dano recebido.' },
  ],
  mago: [
    { id: 'bola-fogo', name: 'Bola de Fogo', categoria: 'energetica', energiaId: 'termica', power: 50,
      effect: { type: 'queimando', chance: 0.15, duration: 3 },
      desc: '15% de chance de queimar (6% do HP máx. do inimigo por turno, 3 turnos).' },
    { id: 'flecha-gelo', name: 'Flecha de Gelo', categoria: 'energetica', energiaId: 'agua', power: 45,
      effect: { type: 'lentidao', chance: 0.55, duration: 2 },
      desc: '55% de chance de reduzir a Velocidade do inimigo em 30% por 2 turnos.' },
  ],
  arqueiro: [
    { id: 'tiro-certeiro', name: 'Tiro Certeiro', categoria: 'fisica', power: 45, critBonus: 15,
      desc: '+15 de Crítico — chance bem maior de dano dobrado.' },
    { id: 'tiro-perfurante', name: 'Tiro Perfurante', categoria: 'fisica', power: 48, ignoreDef: 0.5,
      desc: 'Ignora 50% da Defesa do inimigo.' },
  ],
  assassino: [
    { id: 'golpe-sombras', name: 'Golpe das Sombras', categoria: 'fisica', power: 42, alwaysFirst: true,
      desc: 'Sempre age primeiro no turno, não importa a Velocidade.' },
    { id: 'aneurisma', name: 'Aneurisma', categoria: 'energetica', energiaId: 'medo', power: 40,
      effect: { type: 'selado', chance: 0.65, duration: 2 },
      desc: '65% de chance de selar as habilidades Energéticas/Híbridas do inimigo por 2 turnos.' },
  ],
};

export const PLAYER_BASE_STATS = { vit: 29, atf: 4, ate: 3, def: 130, bld: 125, spd: 18, acc: 90, crt: 37, crd: 23, rd: 69 };
export const ATTRIBUTE_KEYS = ['vit', 'atf', 'ate', 'def', 'bld', 'spd', 'acc', 'crt', 'crd', 'rd'];
export const ATTRIBUTE_LABELS = { vit: 'VIT', atf: 'ATF', ate: 'ATE', def: 'DEF', bld: 'BLD', spd: 'SPD', acc: 'ACC', crt: 'CRT', crd: 'CRD', rd: 'RD' };
export const ATTRIBUTE_POINT_VALUE = { vit: 1, atf: 1, ate: 1, def: 1, bld: 1, spd: 1, acc: 1, crt: 1, crd: 1, rd: 1 };
export const TYPE_IDS = Object.keys(ENERGY_TREE);
export const MAX_BATTLE_ABILITIES = 5;
export const DEFAULT_WEAPON_ID = 'espada_curta';

export const LEGACY_ABILITY_CATALOG = Object.fromEntries(Object.values(ABILITIES).flat().map((a) => [a.id, a]));

export function buildProvisionalTypePool(typeId) {
  const label = ENERGY_TREE[typeId].label;
  const authored = {
    termica: { id: 'bola-fogo', name: 'Bola de Fogo', categoria: 'energetica', energiaId: 'termica', power: 50,
      effect: { type: 'queimando', chance: 0.15, duration: 3 }, desc: '15% de chance de queimar por 3 turnos.' },
    agua: { id: 'flecha-gelo', name: 'Flecha de Gelo', categoria: 'energetica', energiaId: 'agua', power: 45,
      effect: { type: 'lentidao', chance: 0.55, duration: 2 }, desc: '55% de chance de reduzir a Velocidade por 2 turnos.' },
    medo: { id: 'aneurisma', name: 'Aneurisma', categoria: 'energetica', energiaId: 'medo', power: 40,
      effect: { type: 'selado', chance: 0.65, duration: 2 }, desc: '65% de chance de selar habilidades Energéticas/Híbridas por 2 turnos.' },
  }[typeId];
  const pool = [
    authored || { id: `${typeId}-pulso`, name: `Pulso de ${label}`, categoria: 'energetica', energiaId: typeId, power: 46, desc: `Manifestação direta da Energia ${label}.` },
    { id: `${typeId}-ruptura`, name: `Ruptura de ${label}`, categoria: 'energetica', energiaId: typeId, power: 55, critBonus: 5, desc: `Golpe energético mais forte de ${label}.` },
    { id: `${typeId}-impacto`, name: `Impacto de ${label}`, categoria: 'hibrida', energiaId: typeId, power: 48, fisicaPct: 0.5, desc: 'Mistura força física e energia em um único impacto.' },
    { ...LEGACY_ABILITY_CATALOG.revidar, id: `${typeId}-revidar` },
  ];
  return pool;
}

export const TYPE_ABILITY_POOLS = Object.fromEntries(TYPE_IDS.map((id) => [id, buildProvisionalTypePool(id)]));

export function typeAvatarStyle(typeId) {
  if (['terra', 'juramento'].includes(typeId)) return 'guerreiro';
  if (['ceu', 'cosmica', 'termica', 'nuclear'].includes(typeId)) return 'mago';
  if (['agua', 'vento', 'amor'].includes(typeId)) return 'arqueiro';
  return 'assassino';
}

export function avatarForCharacter(character) {
  const styleId = character.avatarStyle || character.classId || typeAvatarStyle(character.typeId || 'terra');
  const style = CLASSES.find((c) => c.id === styleId) || CLASSES[0];
  return character.gender === 'f' ? style.avatarF : style.avatarM;
}

export function getPlayerStats(character) {
  const legacy = CLASSES.find((c) => c.id === character.classId);
  const base = character.baseStats || legacy?.stats || PLAYER_BASE_STATS;
  const alloc = character.attributeAllocations || {};
  const out = {};
  for (const k of ATTRIBUTE_KEYS) out[k] = Math.round((base[k] || 0) + (alloc[k] || 0) * ATTRIBUTE_POINT_VALUE[k]);
  const typeId = character.typeId || legacy?.energia || 'terra';
  if (ENERGY_TREE[typeId]?.group === 'beta') out.def = Math.round(out.def * 1.05);
  return out;
}

export function getTypeAbilityPool(typeId) { return TYPE_ABILITY_POOLS[typeId] || TYPE_ABILITY_POOLS.terra; }
export function getAbilityById(character, id) {
  return getTypeAbilityPool(character.typeId).find((a) => a.id === id) || LEGACY_ABILITY_CATALOG[id] || null;
}
export function getLearnedAbilities(character) {
  return (character.learnedAbilityIds || []).map((id) => getAbilityById(character, id)).filter(Boolean);
}
export function getBattleAbilities(character) {
  const equipped = (character.equippedAbilityIds || []).slice(0, MAX_BATTLE_ABILITIES);
  return equipped.map((id) => getAbilityById(character, id)).filter(Boolean);
}
export function getEquippedWeapon(character) {
  const id = character.equippedWeaponId;
  const item = id && ITEMS[id]?.category === 'arma' ? ITEMS[id] : null;
  return item ? { id, ...item } : null;
}
export function makeWeaponBasicAttack(character) {
  const weapon = getEquippedWeapon(character);
  if (!weapon) return { id: 'sem-arma', name: 'Ataque Desarmado', categoria: 'fisica', power: 20 };
  return { id: `${weapon.id}-basico`, name: `Ataque com ${weapon.name}`, categoria: 'fisica', energiaId: weapon.energiaId, power: weapon.basicPower || 25, weaponAttack: true };
}
export function getWeaponAttacks(character) { return getEquippedWeapon(character)?.attacks || []; }

export function migrateCharacter(raw) {
  if (!raw) return raw;
  const legacy = CLASSES.find((c) => c.id === raw.classId);
  const typeId = raw.typeId || legacy?.energia || 'terra';
  let inventory = { ...(raw.inventory || {}) };
  if (!(inventory[DEFAULT_WEAPON_ID] > 0)) inventory[DEFAULT_WEAPON_ID] = 1;
  const legacyAbilityIds = legacy ? (ABILITIES[legacy.id] || []).map((a) => a.id) : [];
  const learnedAbilityIds = Array.isArray(raw.learnedAbilityIds) ? raw.learnedAbilityIds : legacyAbilityIds.length ? legacyAbilityIds : getTypeAbilityPool(typeId).slice(0, 2).map((a) => a.id);
  const equippedAbilityIds = Array.isArray(raw.equippedAbilityIds) ? raw.equippedAbilityIds.slice(0, MAX_BATTLE_ABILITIES) : learnedAbilityIds.slice(0, MAX_BATTLE_ABILITIES);
  const migrated = {
    ...raw,
    typeId,
    avatarStyle: raw.avatarStyle || raw.classId || typeAvatarStyle(typeId),
    baseStats: raw.baseStats || legacy?.stats || { ...PLAYER_BASE_STATS },
    attributeAllocations: raw.attributeAllocations || {},
    attributePoints: raw.attributePoints ?? ((raw.level || 0) * 4),
    learnedAbilityIds,
    equippedAbilityIds,
    equippedWeaponId: raw.equippedWeaponId || DEFAULT_WEAPON_ID,
    inventory,
  };
  const stats = getPlayerStats(migrated);
  const maxHp = hp(stats.vit);
  migrated.maxHp = maxHp;
  migrated.hp = Math.min(raw.hp ?? maxHp, maxHp);
  return migrated;
}

export const STATUS_LABELS = { queimando: 'Queimando', lentidao: 'Lento', atordoado: 'Atordoado', selado: 'Selado' };

export const ZONES = [
  { id: 1, name: 'Floresta Sombria', level: '1-5', desc: 'Criaturas iniciantes espreitam entre árvores antigas.', Icon: TreePine, bg: ASSETS.BG_FLORESTA },
  { id: 2, name: 'Ruínas Antigas', level: '5-10', desc: 'Restos de uma civilização perdida, guardados por golens.', Icon: Landmark, bg: null },
  { id: 3, name: 'Pântano Amaldiçoado', level: '10-16', desc: 'Névoa densa esconde perigos venenosos.', Icon: Droplets, bg: null },
  { id: 4, name: 'Covil do Dragão', level: '20+', desc: 'Dungeon final — um boss lendário aguarda.', Icon: Flame, bg: null },
];

export const ENEMIES = {
  1: [
    { id: 'lobo', name: 'Lobo Sombrio', img: ASSETS.ENEMY_LOBO, weight: 5, tier: 'comum', xpBase: 10, dropChance: 0.25, personalidade: 'agressivo',
      spd: 20, acc: 85, crt: 15, crd: 15, energia: 'terra',
      drop: 'olho_lobo' },
    { id: 'cavaleiro', name: 'Cavaleiro do Reino', img: ASSETS.ENEMY_CAVALEIRO, weight: 4, tier: 'comum', xpBase: 13, dropChance: 0, personalidade: 'defensivo',
      spd: 8, acc: 88, crt: 10, crd: 15, energia: 'terra', drop: null },
    { id: 'diabo', name: 'Diabo da Tasmânia', img: ASSETS.ENEMY_DIABO, weight: 1, tier: 'minichefe', boss: true, xpBase: 200, dropChance: 0.8, personalidade: 'agressivo',
      spd: 14, acc: 90, crt: 20, crd: 20, energia: 'odio',
      special: { name: 'Fúria Selvagem', every: 3, powerMult: 1.6 },
      drop: () => (Math.random() < 0.5 ? 'garra_diabo' : 'chifre_diabo') },
  ],
  2: [
    { id: 'golem', name: 'Golem Antigo', icon: 'Landmark', weight: 1, tier: 'elite', xpBase: 50, dropChance: 0, personalidade: 'defensivo',
      spd: 8, acc: 85, crt: 8, crd: 15, energia: 'terra', drop: null },
  ],
  3: [
    { id: 'sanguessuga', name: 'Sanguessuga Venenosa', icon: 'Droplets', weight: 1, tier: 'elite', xpBase: 55, dropChance: 0, personalidade: 'equilibrado',
      spd: 14, acc: 85, crt: 12, crd: 15, energia: 'agua', drop: null },
  ],
  4: [
    { id: 'dragao', name: 'Dragão Ancião', icon: 'Flame', weight: 1, tier: 'boss', boss: true, xpBase: 1000, dropChance: 1, personalidade: 'equilibrado',
      spd: 15, acc: 92, crt: 22, crd: 25, energia: 'nuclear',
      special: { name: 'Fogo Ancestral', every: 3, powerMult: 1.7 }, drop: null },
  ],
};

export const ICON_MAP = { Landmark, Droplets, Flame, PawPrint };

export const RARITY = {
  comum: { label: 'Comum', className: 'rarity-comum' },
  incomum: { label: 'Incomum', className: 'rarity-incomum' },
  raro: { label: 'Raro', className: 'rarity-raro' },
  epico: { label: 'Épico', className: 'rarity-epico' },
  lendario: { label: 'Lendário', className: 'rarity-lendario' },
};

export const ITEMS = {
  ferro: { name: 'Ferro', category: 'recurso', rarity: 'comum', img: ASSETS.MAT_FERRO, price: 20, desc: 'Metal comum, base de muitas forjas.' },
  madeira: { name: 'Madeira Rígida', category: 'recurso', rarity: 'comum', img: ASSETS.MAT_MADEIRA, price: 15, desc: 'Madeira densa, resistente ao fogo.' },
  erva: { name: 'Erva Vital', category: 'recurso', rarity: 'comum', img: ASSETS.MAT_ERVA, price: 12, desc: 'Planta com propriedades curativas.' },
  agua: { name: 'Água Pura', category: 'recurso', rarity: 'comum', img: ASSETS.MAT_AGUA, price: 10, desc: 'Água cristalina de nascente.' },
  frasco: { name: 'Frasco de Energia', category: 'recurso', rarity: 'incomum', img: ASSETS.MAT_FRASCO, price: 80, desc: 'Energia condensada em estado líquido.' },
  olho_lobo: { name: 'Olho de Lobo Sombrio', category: 'recurso', rarity: 'incomum', img: ASSETS.DROP_OLHO, price: 90, desc: 'Ainda brilha com um resquício de instinto selvagem.' },
  garra_diabo: { name: 'Garra do Diabo da Tasmânia', category: 'recurso', rarity: 'raro', img: ASSETS.DROP_GARRA, price: 220, desc: 'Afiada o bastante para cortar couro grosso.' },
  chifre_diabo: { name: 'Chifre da Tasmânia', category: 'recurso', rarity: 'raro', img: ASSETS.DROP_CHIFRE, price: 220, desc: 'Denso e resistente a altas temperaturas.' },

  espada_curta: { name: 'Espada Curta', category: 'arma', rarity: 'comum', Icon: Sword, price: 40, energiaId: 'terra', basicPower: 25, attacks: [{ id: 'espada-curta-corte', name: 'Corte de Pedra', categoria: 'fisica', energiaId: 'terra', power: 42, rdCost: 14 }, { id: 'espada-curta-quebra', name: 'Quebra-Guarda', categoria: 'fisica', energiaId: 'terra', power: 50, rdCost: 17, ignoreDef: 0.2 }], desc: 'Uma lâmina simples, confiável para iniciantes.' },
  espada_ferro: { name: 'Espada de Ferro', category: 'arma', rarity: 'comum', Icon: Sword, price: 65, energiaId: 'terra', basicPower: 28, attacks: [{ id: 'espada-ferro-peso', name: 'Peso da Montanha', categoria: 'fisica', energiaId: 'terra', power: 48, rdCost: 16 }, { id: 'espada-ferro-fenda', name: 'Fenda Mineral', categoria: 'hibrida', energiaId: 'terra', power: 56, rdCost: 19, fisicaPct: 0.7 }], desc: 'Forjada com ferro batido, corte consistente.' },
  adaga_sombria: { name: 'Adaga Sombria', category: 'arma', rarity: 'incomum', Icon: Sword, price: 160, energiaId: 'medo', basicPower: 24, attacks: [{ id: 'adaga-sussurro', name: 'Sussurro Sombrio', categoria: 'fisica', energiaId: 'medo', power: 45, rdCost: 15, critBonus: 10 }, { id: 'adaga-panico', name: 'Corte do Pânico', categoria: 'hibrida', energiaId: 'medo', power: 52, rdCost: 18, fisicaPct: 0.75, effect: { type: 'selado', chance: 0.25, duration: 1 } }], desc: 'Feita para golpes rápidos e silenciosos.' },
  katana_vento: { name: 'Katana do Vento', category: 'arma', rarity: 'raro', Icon: Sword, price: 340, energiaId: 'vento', basicPower: 30, attacks: [{ id: 'katana-rajada', name: 'Corte de Rajada', categoria: 'fisica', energiaId: 'vento', power: 52, rdCost: 17, alwaysFirst: true }, { id: 'katana-ciclone', name: 'Ciclone Cortante', categoria: 'hibrida', energiaId: 'vento', power: 62, rdCost: 21, fisicaPct: 0.65 }], desc: 'Tão leve que quase canta ao cortar o ar.' },
  machado_sombrio: { name: 'Machado Sombrio', category: 'arma', rarity: 'epico', Icon: Axe, price: 620, energiaId: 'odio', basicPower: 34, attacks: [{ id: 'machado-furia', name: 'Talho de Ódio', categoria: 'fisica', energiaId: 'odio', power: 62, rdCost: 21 }, { id: 'machado-ruina', name: 'Ruína Carmesim', categoria: 'hibrida', energiaId: 'odio', power: 72, rdCost: 24, fisicaPct: 0.8, critBonus: 8 }], desc: 'Pesado, brutal, impossível de ignorar.' },
  coroa_perdida: { name: 'Coroa Perdida', category: 'arma', rarity: 'lendario', Icon: Sword, price: 1400, energiaId: 'ceu', basicPower: 36, attacks: [{ id: 'coroa-decreto', name: 'Decreto Celeste', categoria: 'energetica', energiaId: 'ceu', power: 72, rdCost: 24 }, { id: 'coroa-julgamento', name: 'Julgamento do Céu', categoria: 'hibrida', energiaId: 'ceu', power: 82, rdCost: 28, fisicaPct: 0.4, critBonus: 10 }], desc: 'Dizem que já pertenceu a um rei esquecido.' },

  armadura_ferro: { name: 'Armadura de Ferro', category: 'armadura', rarity: 'comum', Icon: Shield, price: 70, desc: 'Proteção sólida, sem frescuras.' },
  elmo_fera: { name: 'Elmo da Fera', category: 'armadura', rarity: 'raro', Icon: Shield, price: 300, desc: 'Esculpido a partir do crânio de uma fera abatida.' },
  manto_elfico: { name: 'Manto Élfico', category: 'armadura', rarity: 'incomum', Icon: Shield, price: 150, desc: 'Tecido élfico, leve e surpreendentemente resistente.' },
  livro_furia: { name: 'Livro: Fúria Elemental', category: 'livro', rarity: 'epico', Icon: Sparkles, price: 700, desc: 'Contém uma técnica de combate perdida.' },
  pocao_cura: { name: 'Poção de Cura', category: 'consumivel', rarity: 'comum', Icon: Sparkles, healAmount: 60, price: 30, desc: 'Recupera 60 de HP ao ser consumida.' },
  antidoto: { name: 'Antídoto', category: 'consumivel', rarity: 'comum', Icon: Droplets, price: 25, desc: 'Neutraliza venenos e toxinas leves.' },
  elixir_energia: { name: 'Elixir de Energia', category: 'consumivel', rarity: 'incomum', Icon: Sparkles, price: 85, desc: 'Restaura parte da Reserva Dyson.' },
};

export const ITEM_CATEGORIES = [
  { id: 'arma', label: 'Armas' },
  { id: 'armadura', label: 'Armaduras' },
  { id: 'livro', label: 'Livros' },
  { id: 'recurso', label: 'Recursos' },
  { id: 'consumivel', label: 'Consumíveis' },
];

export const RARITY_WEIGHTS = { comum: 16, incomum: 8, raro: 4, epico: 2, lendario: 1 };
export const RARITY_STOCK_RANGE = { comum: [10, 30], incomum: [5, 15], raro: [2, 6], epico: [1, 3], lendario: [1, 1] };
export const RARITY_SELL_MULT = 0.4;
export const SHOP_ROTATION_MS = 20 * 60 * 1000;
export const SHOP_SLOT_COUNT = 8;

export function generateShopStock() {
  const pool = Object.entries(ITEMS).filter(([, it]) => it.price);
  const chosen = {};
  let tries = 0;
  const maxTries = SHOP_SLOT_COUNT * 4;
  while (Object.keys(chosen).length < Math.min(SHOP_SLOT_COUNT, pool.length) && tries < maxTries) {
    tries++;
    const total = pool.reduce((s, [, it]) => s + (RARITY_WEIGHTS[it.rarity] || 1), 0);
    let roll = Math.random() * total;
    let pickId = pool[0][0];
    for (const [id, it] of pool) {
      const w = RARITY_WEIGHTS[it.rarity] || 1;
      if (roll < w) { pickId = id; break; }
      roll -= w;
    }
    if (chosen[pickId]) continue;
    const [lo, hi] = RARITY_STOCK_RANGE[ITEMS[pickId].rarity] || [1, 5];
    chosen[pickId] = lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  return { items: chosen, generatedAt: Date.now() };
}

export const STARTER_INVENTORY = { ferro: 5, madeira: 3, erva: 3, agua: 3, espada_curta: 1 };

export const RECIPES = [
  { id: 'r1', result: 'espada_ferro', qty: 1, materials: [{ item: 'ferro', qty: 3 }, { item: 'madeira', qty: 1 }] },
  { id: 'r2', result: 'pocao_cura', qty: 1, materials: [{ item: 'erva', qty: 2 }, { item: 'agua', qty: 1 }] },
  { id: 'r3', result: 'armadura_ferro', qty: 1, materials: [{ item: 'ferro', qty: 4 }, { item: 'madeira', qty: 1 }] },
  { id: 'r4', result: 'adaga_sombria', qty: 1, materials: [{ item: 'olho_lobo', qty: 2 }, { item: 'frasco', qty: 1 }] },
  { id: 'r5', result: 'elmo_fera', qty: 1, materials: [{ item: 'garra_diabo', qty: 1 }, { item: 'chifre_diabo', qty: 1 }, { item: 'ferro', qty: 2 }] },
  { id: 'r6', result: 'livro_furia', qty: 1, materials: [{ item: 'frasco', qty: 2 }, { item: 'chifre_diabo', qty: 1 }] },
];

export function addToInventory(inv, itemId, qty) {
  const next = { ...inv };
  next[itemId] = Math.min(999, (next[itemId] || 0) + qty);
  return next;
}
export function craftItem(inv, recipe) {
  const canDo = recipe.materials.every((m) => (inv[m.item] || 0) >= m.qty);
  if (!canDo) return inv;
  let next = { ...inv };
  for (const m of recipe.materials) next[m.item] -= m.qty;
  next = addToInventory(next, recipe.result, recipe.qty);
  return next;
}

export const SAMPLE_CREATURES = [
  { id: 1, name: 'Lobo Sombrio', level: 3, hp: 40, maxHp: 40, Icon: PawPrint },
  { id: 2, name: 'Slime Cristalino', level: 2, hp: 25, maxHp: 25, Icon: Gem },
];

export const SHOP_ITEMS = [
  { id: 1, name: 'Poção de Cura', price: 15, Icon: Sparkles },
  { id: 2, name: 'Espada de Aço', price: 120, Icon: Sword },
  { id: 3, name: 'Escudo Reforçado', price: 90, Icon: Shield },
  { id: 4, name: 'Antídoto', price: 25, Icon: Droplets },
];

export const MARKET_LISTINGS = [
  { id: 1, seller: 'Jogador 2', item: 'Katana do Vento', price: 300 },
  { id: 2, seller: 'Jogador 3', item: 'Essência Sombria x5', price: 150 },
  { id: 3, seller: 'Jogador 4', item: 'Manto Élfico', price: 220 },
];

export const PVP_KEY_PREFIX = 'pvp_roster:';

export const NAV_ITEMS = [
  { id: 'inicio', label: 'Início', Icon: Home },
  { id: 'mapa', label: 'Mapa', Icon: Compass },
  { id: 'inventario', label: 'Itens', Icon: Package },
  { id: 'criaturas', label: 'Criaturas', Icon: PawPrint },
  { id: 'loja', label: 'Loja', Icon: Store },
  { id: 'pvp', label: 'PvP', Icon: Swords },
];

export function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export function baseDamage(attackerStats, ability, defenderStats) {
  const p2 = ability.power * ability.power;
  if (ability.categoria === 'fisica') {
    const def = defenderStats.def * (1 - (ability.ignoreDef || 0));
    return (attackerStats.atf * p2) / (def + 50);
  }
  if (ability.categoria === 'energetica') return (attackerStats.ate * p2) / (defenderStats.bld + 50);
  const fisicaPct = ability.fisicaPct ?? 0.7;
  const def = defenderStats.def * (1 - (ability.ignoreDef || 0));
  const baseF = (attackerStats.atf * p2) / (def + 50);
  const baseE = (attackerStats.ate * p2) / (defenderStats.bld + 50);
  return baseF * fisicaPct + baseE * (1 - fisicaPct);
}

export function critChance(crt, bonus = 0) { return Math.min(0.60, 0.05 + crt / 2000 + bonus / 100); }
export function critMultiplier(crd) { return 1.5 + crd / 100; }
export function hitChance(acc, targetSpd, precisaoMult = 1) {
  return Math.min(0.99, Math.max(0.55, (0.70 + acc / 300 - targetSpd / 400) * precisaoMult));
}
export function resonanceMultiplier(count) {
  if (count >= 6) return 1.20; if (count === 5) return 1.15; if (count === 4) return 1.10; if (count === 3) return 1.05; return 1.0;
}

export function rollDamage(attackerStats, ability, defenderStats, atkEnergyId, defEnergyId, resonanceCount, precisaoMult, targetSpdEffective) {
  const missed = Math.random() > hitChance(attackerStats.acc, targetSpdEffective, precisaoMult);
  if (missed) return { hit: false };
  const base = baseDamage(attackerStats, ability, defenderStats);
  const typeM = atkEnergyId ? typeMultiplier(atkEnergyId, defEnergyId) : 1.0;
  const isCrit = Math.random() < critChance(attackerStats.crt, ability.critBonus || 0);
  const critM = isCrit ? critMultiplier(attackerStats.crd) : 1.0;
  const resM = atkEnergyId ? resonanceMultiplier(resonanceCount) : 1.0;
  const rand = 0.92 + Math.random() * 0.16;
  const dmg = Math.max(1, Math.round(base * typeM * critM * resM * rand));
  return { hit: true, dmg, isCrit, typeM, resM };
}

export function applyStatus(list, effect) {
  const filtered = list.filter((s) => s.type !== effect.type);
  return [...filtered, { type: effect.type, duration: effect.duration }];
}
export function hasStatus(list, type) { return list.some((s) => s.type === type); }
export function slowMult(list) { return hasStatus(list, 'lentidao') ? 0.70 : 1.0; }
export function isSealed(list) { return hasStatus(list, 'selado'); }

export function tickStatuses(list, name, maxHp) {
  let dot = 0;
  const messages = [];
  const next = [];
  for (const s of list) {
    if (s.type === 'queimando') {
      const d = Math.round(maxHp * 0.06);
      dot += d;
      messages.push(`${name} sofre ${d} de queimadura.`);
    }
    const d2 = s.duration - 1;
    if (d2 > 0) next.push({ ...s, duration: d2 });
  }
  return [next, dot, messages];
}
export function effectMessage(targetName, effect) {
  if (effect.type === 'queimando') return `${targetName} está queimando!`;
  if (effect.type === 'lentidao') return `${targetName} ficou mais lento!`;
  if (effect.type === 'atordoado') return `${targetName} ficou atordoado!`;
  if (effect.type === 'selado') return `Habilidades Energéticas de ${targetName} foram seladas!`;
  return '';
}
export const FAMILIAR_SPECIES = {
  conjus: {
    name: 'Conjus', especie: 'Ave Estelar', tipo: 'cosmica', rarity: 'epico', img: ASSETS.FAM_CONJUS, iaPersonalidade: 'equilibrado',
    baseStats: { vida: 42, atf: 3, ate: 6, def: 110, bld: 116, spd: 20, acc: 85, crt: 20, crd: 15 },
    passiva: { name: 'Visão Cósmica', desc: 'Aumenta a chance de crítico em 10% durante toda a batalha.' },
    ataques: [
      { name: 'Rajada Estelar', tipo: 'cosmica', categoria: 'energetica', energiaId: 'cosmica', power: 38, acc: 92 },
      { name: 'Ofuscar', tipo: 'cosmica', categoria: 'energetica', energiaId: 'cosmica', power: 15, acc: 100 },
      { name: 'Investida Alada', tipo: 'fisica', categoria: 'fisica', power: 32, acc: 100 },
    ],
    sobre: 'Conjus vive nos picos mais altos, onde observa as constelações e absorve energia cósmica nas noites sem lua.',
    personalidade: 'Serena', tamanho: '0,6 m', peso: '8,2 kg',
  },
  gligo: {
    name: 'Gligo', especie: 'Elemental Flamejante', tipo: 'termica', rarity: 'raro', img: ASSETS.FAM_GLIGO, iaPersonalidade: 'agressivo',
    baseStats: { vida: 40, atf: 4, ate: 5, def: 114, bld: 112, spd: 16, acc: 88, crt: 15, crd: 15 },
    passiva: { name: 'Chama Interior', desc: 'Quando a Vida cai abaixo de 30%, o Ataque aumenta 20% até o fim do combate.' },
    ataques: [
      { name: 'Punho Flamejante', tipo: 'termica', categoria: 'energetica', energiaId: 'termica', power: 40, acc: 100 },
      { name: 'Investida', tipo: 'fisica', categoria: 'fisica', power: 30, acc: 100 },
      { name: 'Explosão Ígnea', tipo: 'termica', categoria: 'energetica', energiaId: 'termica', power: 55, acc: 85 },
    ],
    sobre: 'Gligo nasce onde a lava encontra o ar. Suas mãos ardem constantemente, mas nunca queimam a si mesmo.',
    personalidade: 'Impulsivo', tamanho: '1,1 m', peso: '42 kg',
  },
};
export const FISSURA_POOL = [
  { speciesId: 'gligo', weight: 6 },
  { speciesId: 'conjus', weight: 2 },
];

export function familiarStatAtLevel(base, level) { return Math.round(base * (1 + 0.05 * (level - 1))); }
export function familiarStatsAtLevel(species, level) {
  const out = {};
  for (const k in species.baseStats) out[k] = familiarStatAtLevel(species.baseStats[k], level);
  return out;
}
export function rollWildFamiliar() {
  const total = FISSURA_POOL.reduce((s, f) => s + f.weight, 0);
  let roll = Math.random() * total;
  let chosen = FISSURA_POOL[0];
  for (const f of FISSURA_POOL) { if (roll < f.weight) { chosen = f; break; } roll -= f.weight; }
  const level = 1 + Math.floor(Math.random() * 5);
  return { speciesId: chosen.speciesId, level };
}
export function captureChance(hpPct) { return Math.min(0.9, Math.max(0.15, 0.9 - hpPct * 0.7)); }
export function makeFamiliarInstance(speciesId, level, location) {
  return {
    instanceId: `f_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    speciesId, nickname: FAMILIAR_SPECIES[speciesId].name, level,
    favorite: false, capturedLocation: location,
  };
}

export const PERSONALITY_WEIGHTS = {
  agressivo: { aggro: 1.0, control: 0.4 },
  defensivo: { aggro: 0.5, control: 1.0 },
  equilibrado: { aggro: 0.8, control: 0.8 },
};

export function tierIntelligence(tier) {
  if (tier === 'boss') return 2;
  if (tier === 'elite' || tier === 'minichefe') return 1;
  return 0;
}

export function adaptiveWeights(personalidade, patternCounter) {
  const base = PERSONALITY_WEIGHTS[personalidade];
  if (!patternCounter) return base;
  const bonus = Math.min(3, Math.abs(patternCounter)) * 0.15;
  return patternCounter > 0 ? { aggro: base.aggro, control: base.control + bonus } : { aggro: base.aggro + bonus, control: base.control };
}

export function scoreMove(move, atkStats, defStats, defHp, defStatuses, weights, intelligence, ctx) {
  const power = move.power || 0;
  const estDmg = power > 0 ? baseDamage(atkStats, move, defStats) : 0;
  const dmgScore = power > 0 ? Math.min(1, estDmg / Math.max(1, defHp)) : 0;
  const accScore = (move.acc || 100) / 100;
  let score = weights.aggro * dmgScore * accScore;
  if (intelligence >= 1) {
    const alreadyOn = move.effect && hasStatus(defStatuses, move.effect.type);
    const statusScore = move.effect && !alreadyOn ? 0.3 : 0;
    score += weights.control * statusScore;
  }
  if (intelligence >= 2 && ctx) {
    if (ctx.defenderLowHp && move.isFinisher) score += 0.5;
  }
  return score;
}

export function pickMoveUtility(moves, atkStats, defStats, defHp, defStatuses, personalidade, intelligence, ctx) {
  const weights = ctx?.patternCounter ? adaptiveWeights(personalidade, ctx.patternCounter) : PERSONALITY_WEIGHTS[personalidade];
  const scored = moves.map((m) => ({ move: m, score: scoreMove(m, atkStats, defStats, defHp, defStatuses, weights, intelligence, ctx) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 2);
  const total = top.reduce((s, x) => s + x.score, 0) || 1;
  let r = Math.random() * total;
  for (const t of top) { if (r < t.score) return t.move; r -= t.score; }
  return top[0].move;
}

export const ATK_TYPE_EXTRA = { fisica: 'Física', controle: 'Controle' };
export function tipoLabel(tipo) { return ENERGY_TREE[tipo]?.label || ATK_TYPE_EXTRA[tipo] || tipo; }
