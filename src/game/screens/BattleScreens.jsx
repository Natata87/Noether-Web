import React, { useState } from 'react';
import { Package, Sword, Skull, Sparkles, Trophy, ArrowLeft, Axe, PawPrint } from 'lucide-react';
import {
  custoRD,
  precisaoPenaltyApice,
  xpNeeded,
  TIER_LABELS,
  hp,
  pickEnemyTemplate,
  enemySc,
  gerarInimigo,
  getPlayerStats,
  getBattleAbilities,
  getEquippedWeapon,
  makeWeaponBasicAttack,
  getWeaponAttacks,
  STATUS_LABELS,
  ITEMS,
  addToInventory,
  sleep,
  baseDamage,
  rollDamage,
  applyStatus,
  hasStatus,
  slowMult,
  tickStatuses,
  effectMessage,
  tierIntelligence,
  pickMoveUtility,
  tipoLabel,
  ICON_MAP
} from '../data/core.js';

function EnemyIcon({ name, size, className }) {
  const Icon = ICON_MAP[name] || PawPrint;
  return <Icon size={size} className={className} />;
}

export function BattleScreen({ character, avatar, zone, onUpdateCharacter, onEnd }) {
  const playerLvlStats = getPlayerStats(character);
  const [enemy] = useState(() => {
    const template = pickEnemyTemplate(zone.id);
    return gerarInimigo(template, playerLvlStats);
  });
  const [playerHp, setPlayerHp] = useState(character.hp);
  const [enemyHp, setEnemyHp] = useState(hp(enemy.stats.vit));
  const [rd, setRd] = useState(playerLvlStats.rd);
  const [playerStatuses, setPlayerStatuses] = useState([]);
  const [enemyStatuses, setEnemyStatuses] = useState([]);
  const [resonanceEnergy, setResonanceEnergy] = useState(null);
  const [resonanceCount, setResonanceCount] = useState(0);
  const [log, setLog] = useState(`Um ${enemy.name} selvagem apareceu!`);
  const [menu, setMenu] = useState('main');
  const [infoAbility, setInfoAbility] = useState(null);
  const [enemyHit, setEnemyHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [lastSpecialTurn, setLastSpecialTurn] = useState(-99);
  const [patternCounter, setPatternCounter] = useState(0);
  const [turnCount, setTurnCount] = useState(0);

  const abilities = getBattleAbilities(character);
  const weapon = getEquippedWeapon(character);
  const weaponBasic = makeWeaponBasicAttack(character);
  const weaponAttacks = getWeaponAttacks(character);
  const enemyMaxHp = hp(enemy.stats.vit);

  function flashEnemy() { setEnemyHit(true); setTimeout(() => setEnemyHit(false), 450); }
  function flashPlayer() { setPlayerHit(true); setTimeout(() => setPlayerHit(false), 450); }
  async function say(msg, delay = 750) { setLog(msg); await sleep(delay); }

  function applyVictory(xpGained, dropId) {
    let xp = character.xp + xpGained;
    let level = character.level;
    let need = xpNeeded(level);
    while (xp >= need && level < 20) {
      xp -= need; level += 1; need = xpNeeded(level);
    }
    const levelsGained = Math.max(0, level - character.level);
    const newMaxHp = hp(getPlayerStats(character).vit);
    const inventory = dropId ? addToInventory(character.inventory || {}, dropId, 1) : character.inventory;
    onUpdateCharacter({ ...character, level, xp, maxHp: newMaxHp, hp: newMaxHp, attributePoints: (character.attributePoints || 0) + levelsGained * 4, sc: character.sc + enemySc(enemy.tier), inventory });
  }
  function applyDefeat() {
    const recovered = Math.max(1, Math.ceil(character.maxHp * 0.3));
    onUpdateCharacter({ ...character, hp: recovered });
  }

  async function act(actionType, ability) {
    if (busy || result) return;
    const isSkillAction = actionType === 'ability' || actionType === 'weapon';
    const usedAbility0 = actionType === 'ataque' ? weaponBasic : isSkillAction ? ability : null;
    const rdCost0 = isSkillAction ? custoRD(ability, character.typeId) : 0;
    if (!usedAbility0 && actionType !== 'item' && actionType !== 'fugir') return;
    if (rdCost0 > rd) return;
    setBusy(true);
    setMenu('main');
    setInfoAbility(null);

    let pHp = playerHp, eHp = enemyHp;
    let pSt = [...playerStatuses], eSt = [...enemyStatuses];
    let localTurn = turnCount;
    let localRd = rd;
    let localLastSpecial = lastSpecialTurn;
    let localPattern = patternCounter;
    let resEnergy = resonanceEnergy, resCount = resonanceCount;
    let fled = false;

    const revidar = isSkillAction && ability?.isRevidar;
    const pSlowMult = slowMult(pSt), eSlowMult = slowMult(eSt);
    let pFirst = (playerLvlStats.spd * pSlowMult) >= (enemy.stats.spd * eSlowMult);
    if (ability?.alwaysFirst) pFirst = true;
    if (actionType === 'item') pFirst = true;

    function updateResonance(usedAbility) {
      if (!usedAbility?.energiaId) return;
      if (resEnergy === usedAbility.energiaId) resCount += 1; else { resEnergy = usedAbility.energiaId; resCount = 1; }
    }

    async function playerAct() {
      if (hasStatus(pSt, 'atordoado')) {
        pSt = pSt.filter((s) => s.type !== 'atordoado');
        pSt = applyStatus(pSt, { type: 'imune_atordoado', duration: 1 });
        await say(`${character.name} está atordoado(a) e perde o turno!`);
        return;
      }
      if (actionType === 'fugir') {
        if (Math.random() < 0.8) { await say('Você fugiu da batalha!', 500); fled = true; return; }
        await say('Você tentou fugir, mas não conseguiu!');
        return;
      }
      if (actionType === 'item') {
        const heal = ITEMS.pocao_cura.healAmount;
        pHp = Math.min(character.maxHp, pHp + heal);
        setPlayerHp(pHp);
        const inv = { ...(character.inventory || {}) };
        inv.pocao_cura = Math.max(0, (inv.pocao_cura || 0) - 1);
        onUpdateCharacter({ ...character, inventory: inv });
        localPattern = Math.max(-3, localPattern - 1);
        await say(`Você usou uma Poção de Cura e recuperou ${heal} HP!`);
        return;
      }
      if (revidar) { await say(`${character.name} assume postura defensiva, pronto para revidar!`); return; }

      const usedAbility = actionType === 'ataque' ? weaponBasic : ability;
      const rdCost = isSkillAction ? custoRD(usedAbility, character.typeId) : 0;
      if (rdCost) { localRd -= rdCost; setRd(localRd); }

      const precisaoMult = isSkillAction ? precisaoPenaltyApice(usedAbility, character.typeId) : 1;
      const actionResCount = usedAbility.energiaId ? (resEnergy === usedAbility.energiaId ? resCount + 1 : 1) : 0;
      const roll = rollDamage(playerLvlStats, usedAbility, enemy.stats, usedAbility.energiaId || null, enemy.energia, actionResCount, precisaoMult, enemy.stats.spd * eSlowMult);
      const label = usedAbility.name;

      if (!roll.hit) { await say(`${character.name} usa ${label} e erra o golpe!`); updateResonance(usedAbility); return; }
      eHp = Math.max(0, eHp - roll.dmg);
      setEnemyHp(eHp);
      flashEnemy();
      const tag = roll.isCrit ? ' — CRÍTICO!' : roll.typeM > 1 ? ' (vantagem elemental!)' : roll.typeM < 1 ? ' (desvantagem elemental)' : '';
      await say(`${character.name} usa ${label} e causa ${roll.dmg} de dano${tag}`);
      updateResonance(usedAbility);
      localPattern = Math.min(3, localPattern + 1);
      if (eHp <= 0) return;
      if (usedAbility.effect && Math.random() < usedAbility.effect.chance) {
        if (usedAbility.effect.type === 'atordoado' && hasStatus(eSt, 'imune_atordoado')) {
          await say(`${enemy.name} resiste ao atordoamento (ainda imune)!`);
        } else {
          eSt = applyStatus(eSt, usedAbility.effect);
          await say(effectMessage(enemy.name, usedAbility.effect));
        }
      }
    }

    async function enemyAct() {
      if (hasStatus(eSt, 'atordoado')) {
        eSt = eSt.filter((s) => s.type !== 'atordoado');
        eSt = applyStatus(eSt, { type: 'imune_atordoado', duration: 1 });
        await say(`${enemy.name} está atordoado e perde o turno!`);
        localTurn += 1;
        return;
      }
      localTurn += 1;
      const intelligence = tierIntelligence(enemy.tier);
      const basico = { id: 'basico', name: 'Ataque Básico', categoria: 'fisica', power: 25, acc: 90 };
      const moves = [basico];
      const specialReady = enemy.special && (localTurn - localLastSpecial) >= enemy.special.every;
      if (specialReady) {
        moves.push({ id: 'especial', name: enemy.special.name, categoria: 'fisica', power: Math.round(25 * enemy.special.powerMult), acc: 90, isFinisher: true });
      }
      const ctx = intelligence >= 2 ? { defenderLowHp: pHp / character.maxHp < 0.3, patternCounter: localPattern } : null;
      const chosen = moves.length > 1 ? pickMoveUtility(moves, enemy.stats, playerLvlStats, pHp, pSt, enemy.personalidade, intelligence, ctx) : basico;
      if (chosen.id === 'especial') localLastSpecial = localTurn;
      const label = chosen.name;
      const roll = rollDamage(enemy.stats, chosen, playerLvlStats, null, null, 0, 1, playerLvlStats.spd * pSlowMult);
      if (!roll.hit) { await say(`${enemy.name} usa ${label} e erra!`); return; }
      pHp = Math.max(0, pHp - roll.dmg);
      setPlayerHp(pHp);
      flashPlayer();
      await say(`${enemy.name} usa ${label} e causa ${roll.dmg} de dano${roll.isCrit ? ' — CRÍTICO!' : ''}`);
      if (revidar && pHp > 0) {
        const counter = Math.round(roll.dmg * 1.6);
        eHp = Math.max(0, eHp - counter);
        setEnemyHp(eHp);
        flashEnemy();
        await say(`${character.name} revida com ${counter} de dano!`);
      }
    }

    if (pFirst) {
      await playerAct();
      if (fled) { setBusy(false); setResult({ type: 'fugiu' }); return; }
      if (eHp > 0 && pHp > 0) await enemyAct();
    } else {
      await enemyAct();
      if (!revidar && eHp > 0 && pHp > 0) {
        await playerAct();
        if (fled) { setBusy(false); setResult({ type: 'fugiu' }); return; }
      }
    }

    setTurnCount(localTurn);
    setLastSpecialTurn(localLastSpecial);
    setPatternCounter(localPattern);
    setResonanceEnergy(resEnergy);
    setResonanceCount(resCount);

    if (eHp <= 0) { applyVictory(enemy.xpBase, enemy.drop); setResult({ type: 'vitoria', xp: enemy.xpBase, tier: enemy.tier, sc: enemySc(enemy.tier), drop: enemy.drop }); setBusy(false); return; }
    if (pHp <= 0) { applyDefeat(); setResult({ type: 'derrota' }); setBusy(false); return; }

    const [pSt2, pDot, pMsgs] = tickStatuses(pSt, character.name, character.maxHp);
    const [eSt2, eDot, eMsgs] = tickStatuses(eSt, enemy.name, enemyMaxHp);
    if (pDot > 0) { pHp = Math.max(0, pHp - pDot); setPlayerHp(pHp); }
    if (eDot > 0) { eHp = Math.max(0, eHp - eDot); setEnemyHp(eHp); }
    setPlayerStatuses(pSt2);
    setEnemyStatuses(eSt2);
    if (pMsgs.length || eMsgs.length) await say([...eMsgs, ...pMsgs].join(' '));

    if (eHp <= 0) { applyVictory(enemy.xpBase, enemy.drop); setResult({ type: 'vitoria', xp: enemy.xpBase, tier: enemy.tier, sc: enemySc(enemy.tier), drop: enemy.drop }); }
    else if (pHp <= 0) { applyDefeat(); setResult({ type: 'derrota' }); }

    setBusy(false);
  }

  if (result) return <BattleResult result={result} character={character} enemy={enemy} onEnd={onEnd} />;

  return (
    <div className="app-bg battle-bg w-full h-screen flex items-center justify-center" style={zone.bg ? { backgroundImage: `url(${zone.bg})` } : {}}>
      <div className="w-full max-w-md h-full flex flex-col battle-content">
        <div className="px-4 pt-4 flex items-center justify-between">
          <span className="font-display text-sm text-gold">{zone.name}</span>
          <button onClick={() => act('fugir')} disabled={busy} className="text-tiny text-muted underline">Sair</button>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3 px-3">
          <div className="combatant-row">
            <div className="combatant-side">
              <span className="text-tiny text-parchment">{character.name}</span>
              <div className="bar-track w-full"><div className="bar-fill-hp" style={{ width: `${Math.max(0, (playerHp / character.maxHp) * 100)}%` }} /></div>
              <span className="text-tiny text-muted">{playerHp}/{character.maxHp}</span>
              <div className="bar-track w-full"><div className="bar-fill-rd" style={{ width: `${(rd / playerLvlStats.rd) * 100}%` }} /></div>
              <span className="text-tiny text-muted">RD {rd}/{playerLvlStats.rd}</span>
              <div className="flex gap-1 flex-wrap justify-center">
                {playerStatuses.filter(s => s.type !== 'imune_atordoado').map((s) => <span key={s.type} className={`tag-pill status-pill-${s.type}`}>{STATUS_LABELS[s.type]}</span>)}
              </div>
            </div>
            <span className="vs-mark">VS</span>
            <div className="combatant-side">
              <div className="flex items-center gap-1">
                <span className="text-tiny text-parchment">{enemy.name}</span>
                {enemy.boss && <span className="tag-pill text-gold">{TIER_LABELS[enemy.tier]}</span>}
              </div>
              <div className="bar-track w-full"><div className="bar-fill-hp" style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }} /></div>
              <span className="text-tiny text-muted">{enemyHp}/{enemyMaxHp}</span>
              <div className="flex gap-1 flex-wrap justify-center">
                {enemyStatuses.filter(s => s.type !== 'imune_atordoado').map((s) => <span key={s.type} className={`tag-pill status-pill-${s.type}`}>{STATUS_LABELS[s.type]}</span>)}
              </div>
              {resonanceCount >= 3 && <span className="resonance-pill">Ressonância x{resonanceCount}</span>}
            </div>
          </div>

          <div className="combatant-row items-end">
            <div className="sprite-stage">
              <img src={avatar} alt={character.name} className={playerHit ? 'sprite-shake' : ''} style={{ height: 170 }} />
              <div className={`sprite-flash-mask ${playerHit ? 'active' : ''}`} style={{ WebkitMaskImage: `url(${avatar})`, maskImage: `url(${avatar})` }} />
            </div>
            <div className="sprite-stage">
              {enemy.img ? (
                <>
                  <img src={enemy.img} alt={enemy.name} className={enemyHit ? 'sprite-shake' : ''} style={{ height: 150 }} />
                  <div className={`sprite-flash-mask ${enemyHit ? 'active' : ''}`} style={{ WebkitMaskImage: `url(${enemy.img})`, maskImage: `url(${enemy.img})` }} />
                </>
              ) : (
                <div className={`medallion ${enemyHit ? 'sprite-shake' : ''}`} style={{ width: 110, height: 110 }}>
                  <EnemyIcon name={enemy.icon} size={48} className={enemyHit ? 'icon-hit' : 'text-gold'} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="panel rounded-xl p-3" style={{ minHeight: 52 }}><p className="text-xs text-parchment">{log}</p></div>
        </div>

        <div className="px-4 pb-4">
          {menu === 'main' && (
            <div className="grid grid-cols-4 gap-2">
              <button disabled={busy} onClick={() => act('ataque')} className="action-btn"><Sword size={18} className="text-gold" /><span className="text-tiny">Atacar</span></button>
              <button disabled={busy || weaponAttacks.length === 0} onClick={() => setMenu('weapon')} className="action-btn"><Axe size={18} className="text-gold" /><span className="text-tiny">Arma</span></button>
              <button disabled={busy || abilities.length === 0} onClick={() => setMenu('abilities')} className="action-btn"><Sparkles size={18} className="text-gold" /><span className="text-tiny">Habilidade</span></button>
              <button disabled={busy} onClick={() => setMenu('items')} className="action-btn"><Package size={18} className="text-gold" /><span className="text-tiny">Item</span></button>
            </div>
          )}
          {menu === 'weapon' && (
            <div className="flex flex-col gap-2">
              <div className="panel rounded-xl p-3">
                <div className="flex items-center justify-between gap-2"><p className="text-sm text-gold font-semibold">{weapon?.name || 'Sem arma'}</p><span className="energy-badge">{tipoLabel(weapon?.energiaId || 'terra')}</span></div>
                <p className="text-tiny text-muted mt-1">O ataque básico é grátis e gera Ressonância de {tipoLabel(weapon?.energiaId || 'terra')}.</p>
              </div>
              {weaponAttacks.map((a) => {
                const rdCost = custoRD(a, character.typeId);
                const sealed = a.categoria !== 'fisica' && hasStatus(playerStatuses, 'selado');
                const disabled = busy || rdCost > rd || sealed;
                const estDmg = Math.round(baseDamage(playerLvlStats, a, enemy.stats));
                return (
                  <button key={a.id} disabled={disabled} onClick={() => act('weapon', a)} className="panel rounded-xl p-3 text-left" style={disabled ? { opacity: 0.45 } : {}}>
                    <div className="flex items-center justify-between gap-2"><p className="text-sm text-parchment font-semibold">{a.name}</p><span className="text-tiny text-gold">{rdCost} RD</span></div>
                    <p className="text-tiny text-muted mt-1">Dano base: {estDmg}{sealed ? ' · Selada' : ''}</p>
                  </button>
                );
              })}
              <button onClick={() => setMenu('main')} className="btn-secondary flex items-center justify-center gap-2"><ArrowLeft size={14} /> Voltar</button>
            </div>
          )}
          {menu === 'abilities' && (
            <div className="flex flex-col gap-2">
              {abilities.map((a) => {
                const rdCost = custoRD(a, character.typeId);
                const sealed = a.categoria !== 'fisica' && hasStatus(playerStatuses, 'selado');
                const disabled = busy || rdCost > rd || sealed;
                const estDmg = a.isRevidar ? null : Math.round(baseDamage(playerLvlStats, a, enemy.stats));
                return (
                  <div key={a.id} className="panel rounded-xl p-3" style={disabled ? { opacity: 0.45 } : {}}>
                    <div className="flex items-center gap-2">
                      <button disabled={disabled} onClick={() => act('ability', a)} className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gold font-semibold">{a.name}</p>
                          <p className="text-xs text-parchment">{estDmg !== null ? `Dano base: ${estDmg}` : 'Contra-ataque'}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {rdCost > 0 && <span className="text-tiny text-muted">{rdCost} RD</span>}
                          {sealed && <span className="text-tiny text-muted">Selada</span>}
                        </div>
                      </button>
                      <button onClick={() => setInfoAbility(infoAbility === a.id ? null : a.id)} className="btn-secondary" style={{ padding: '6px 9px' }}>i</button>
                    </div>
                    {infoAbility === a.id && <p className="text-tiny text-muted mt-2 leading-snug">{a.desc}</p>}
                  </div>
                );
              })}
              <button onClick={() => setMenu('main')} className="btn-secondary flex items-center justify-center gap-2"><ArrowLeft size={14} /> Voltar</button>
            </div>
          )}
          {menu === 'items' && (
            <div className="flex flex-col gap-2">
              <button disabled={busy || !(character.inventory?.pocao_cura > 0)} onClick={() => act('item')} className="panel rounded-xl p-3 flex items-center gap-3 text-left" style={!(character.inventory?.pocao_cura > 0) ? { opacity: 0.45 } : {}}>
                <Sparkles size={20} className="text-gold" />
                <div className="flex-1"><p className="text-sm text-parchment font-semibold">Poção de Cura</p><p className="text-tiny text-muted">Recupera {ITEMS.pocao_cura.healAmount} HP</p></div>
                <span className="text-tiny text-muted">x{character.inventory?.pocao_cura || 0}</span>
              </button>
              <button onClick={() => setMenu('main')} className="btn-secondary flex items-center justify-center gap-2"><ArrowLeft size={14} /> Voltar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BattleResult({ result, character, enemy, onEnd }) {
  if (result.type === 'fugiu') {
    return (
      <div className="app-bg w-full h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md panel rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
          <ArrowLeft size={32} className="text-muted" /><h2 className="font-display text-xl text-parchment">Você fugiu!</h2>
          <button onClick={onEnd} className="btn-primary">Voltar</button>
        </div>
      </div>
    );
  }
  if (result.type === 'derrota') {
    return (
      <div className="app-bg w-full h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md panel rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
          <Skull size={36} className="text-crimson" /><h2 className="font-display text-xl text-crimson">Derrota...</h2>
          <p className="text-sm text-muted">{character.name} foi derrotado(a) por {enemy.name}, mas conseguiu voltar ao vilarejo.</p>
          <button onClick={onEnd} className="btn-primary">Voltar ao Início</button>
        </div>
      </div>
    );
  }
  return (
    <div className="app-bg w-full h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md panel rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
        <Trophy size={36} className="text-gold" /><h2 className="font-display text-xl text-gold">Vitória!</h2>
        <p className="text-sm text-parchment">Você derrotou {enemy.name}</p>
        <div className="flex gap-6">
          <div className="flex flex-col items-center"><span className="text-tiny text-muted">XP</span><span className="font-display text-gold">+{result.xp}</span></div>
          <div className="flex flex-col items-center"><span className="text-tiny text-muted">SC</span><span className="font-display text-gold">+{result.sc}</span></div>
        </div>
        {result.drop && (() => {
          const dropItem = ITEMS[result.drop];
          const DropIcon = dropItem.Icon;
          return (
            <div className="panel rounded-xl p-3 flex items-center gap-3">
              {dropItem.img ? <img src={dropItem.img} alt={dropItem.name} style={{ width: 36, height: 36, objectFit: 'contain' }} /> : <DropIcon size={28} className="text-gold" />}
              <span className="text-sm text-parchment">Encontrado: {dropItem.name}</span>
            </div>
          );
        })()}
        <button onClick={onEnd} className="btn-primary">Continuar</button>
      </div>
    </div>
  );
}
