import React, { useState } from 'react';
import { Package, Sword, Skull, Sparkles, Gem, ArrowLeft, Axe } from 'lucide-react';
import {
  custoRD,
  precisaoPenaltyApice,
  hp,
  getPlayerStats,
  getBattleAbilities,
  getEquippedWeapon,
  makeWeaponBasicAttack,
  getWeaponAttacks,
  STATUS_LABELS,
  ITEMS,
  sleep,
  baseDamage,
  rollDamage,
  applyStatus,
  hasStatus,
  slowMult,
  tickStatuses,
  effectMessage,
  FAMILIAR_SPECIES,
  familiarStatsAtLevel,
  rollWildFamiliar,
  captureChance,
  makeFamiliarInstance,
  pickMoveUtility,
  tipoLabel
} from '../data/core.js';

export function FissuraScreen({ character, onUpdateCharacter, onEnd }) {
  const playerLvlStats = getPlayerStats(character);
  const [wild] = useState(() => rollWildFamiliar());
  const species = FAMILIAR_SPECIES[wild.speciesId];
  const wildStats = familiarStatsAtLevel(species, wild.level);
  const wildMaxHp = hp(wildStats.vida);
  const [playerHp, setPlayerHp] = useState(character.hp);
  const [wildHp, setWildHp] = useState(wildMaxHp);
  const [rd, setRd] = useState(playerLvlStats.rd);
  const [playerStatuses, setPlayerStatuses] = useState([]);
  const [wildStatuses, setWildStatuses] = useState([]);
  const [resonanceEnergy, setResonanceEnergy] = useState(null);
  const [resonanceCount, setResonanceCount] = useState(0);
  const [log, setLog] = useState(`Um ${species.name} selvagem apareceu na Fissura!`);
  const [menu, setMenu] = useState('main');
  const [wildHit, setWildHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const abilities = getBattleAbilities(character);
  const weapon = getEquippedWeapon(character);
  const weaponBasic = makeWeaponBasicAttack(character);
  const weaponAttacks = getWeaponAttacks(character);

  function flashWild() { setWildHit(true); setTimeout(() => setWildHit(false), 450); }
  function flashPlayer() { setPlayerHit(true); setTimeout(() => setPlayerHit(false), 450); }
  async function say(msg, delay = 750) { setLog(msg); await sleep(delay); }

  function applyDefeat() {
    const recovered = Math.max(1, Math.ceil(character.maxHp * 0.3));
    onUpdateCharacter({ ...character, hp: recovered });
  }

  async function act(actionType, ability) {
    if (busy || result) return;
    if (actionType === 'capturar') {
      setBusy(true);
      const chance = captureChance(wildHp / wildMaxHp);
      if (Math.random() < chance) {
        const instance = makeFamiliarInstance(wild.speciesId, wild.level, 'Fissura');
        const familiares = [...(character.familiares || []), instance];
        onUpdateCharacter({ ...character, familiares, hp: playerHp });
        await say(`Capturado! ${species.name} agora é seu Familiar.`, 600);
        setResult('capturado');
      } else {
        await say(`${species.name} resistiu à captura!`);
        if (Math.random() < 0.15) {
          await say(`${species.name} fugiu pela fissura!`, 600);
          onUpdateCharacter({ ...character, hp: playerHp });
          setResult('fugiu');
        }
      }
      setBusy(false);
      return;
    }

    const isSkillAction = actionType === 'ability' || actionType === 'weapon';
    const usedAbility0 = actionType === 'ataque' ? weaponBasic : isSkillAction ? ability : null;
    const rdCost0 = isSkillAction ? custoRD(ability, character.typeId) : 0;
    if (!usedAbility0 && actionType !== 'item') return;
    if (rdCost0 > rd) return;
    setBusy(true);
    setMenu('main');

    let pHp = playerHp, wHp = wildHp;
    let pSt = [...playerStatuses], wSt = [...wildStatuses];
    let localRd = rd;
    let resEnergy = resonanceEnergy, resCount = resonanceCount;

    const revidar = isSkillAction && ability?.isRevidar;
    let pFirst = (playerLvlStats.spd * slowMult(pSt)) >= (wildStats.spd * slowMult(wSt));
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
      if (actionType === 'item') {
        const heal = ITEMS.pocao_cura.healAmount;
        pHp = Math.min(character.maxHp, pHp + heal);
        setPlayerHp(pHp);
        const invNow = { ...(character.inventory || {}) };
        invNow.pocao_cura = Math.max(0, (invNow.pocao_cura || 0) - 1);
        onUpdateCharacter({ ...character, inventory: invNow, hp: pHp });
        await say(`Você usou uma Poção de Cura e recuperou ${heal} HP!`);
        return;
      }
      if (revidar) { await say(`${character.name} assume postura defensiva, pronto para revidar!`); return; }

      const usedAbility = actionType === 'ataque' ? weaponBasic : ability;
      const rdCost = isSkillAction ? custoRD(usedAbility, character.typeId) : 0;
      if (rdCost) { localRd -= rdCost; setRd(localRd); }

      const precisaoMult = isSkillAction ? precisaoPenaltyApice(usedAbility, character.typeId) : 1;
      const wildDefStats = { def: wildStats.def, bld: wildStats.bld, spd: wildStats.spd };
      const actionResCount = usedAbility.energiaId ? (resEnergy === usedAbility.energiaId ? resCount + 1 : 1) : 0;
      const roll = rollDamage(playerLvlStats, usedAbility, wildDefStats, usedAbility.energiaId || null, species.tipo, actionResCount, precisaoMult, wildStats.spd * slowMult(wSt));
      const label = usedAbility.name;

      if (!roll.hit) { await say(`${character.name} usa ${label} e erra o golpe!`); updateResonance(usedAbility); return; }
      wHp = Math.max(0, wHp - roll.dmg);
      setWildHp(wHp);
      flashWild();
      const tag = roll.isCrit ? ' — CRÍTICO!' : roll.typeM > 1 ? ' (vantagem elemental!)' : roll.typeM < 1 ? ' (desvantagem elemental)' : '';
      await say(`${character.name} usa ${label} e causa ${roll.dmg} de dano${tag}`);
      updateResonance(usedAbility);
      if (wHp <= 0) return;
      if (usedAbility.effect && Math.random() < usedAbility.effect.chance) {
        if (!(usedAbility.effect.type === 'atordoado' && hasStatus(wSt, 'imune_atordoado'))) {
          wSt = applyStatus(wSt, usedAbility.effect);
          await say(effectMessage(species.name, usedAbility.effect));
        }
      }
    }

    async function wildAct() {
      if (hasStatus(wSt, 'atordoado')) {
        wSt = wSt.filter((s) => s.type !== 'atordoado');
        wSt = applyStatus(wSt, { type: 'imune_atordoado', duration: 1 });
        await say(`${species.name} está atordoado e perde o turno!`);
        return;
      }
      const move = pickMoveUtility(species.ataques, { atf: wildStats.atf, ate: wildStats.ate, acc: 90, crt: wildStats.crt, crd: wildStats.crd }, playerLvlStats, pHp, pSt, species.iaPersonalidade, 0, null);
      const wildAtkStats = { atf: wildStats.atf, ate: wildStats.ate, acc: move.acc, crt: wildStats.crt, crd: wildStats.crd };
      const roll = rollDamage(wildAtkStats, move, playerLvlStats, move.energiaId || null, character.typeId, 0, 1, playerLvlStats.spd * slowMult(pSt));
      if (!roll.hit) { await say(`${species.name} usa ${move.name} e erra!`); return; }
      pHp = Math.max(0, pHp - roll.dmg);
      setPlayerHp(pHp);
      flashPlayer();
      await say(`${species.name} usa ${move.name} e causa ${roll.dmg} de dano${roll.isCrit ? ' — CRÍTICO!' : ''}`);
      if (revidar && pHp > 0) {
        const counter = Math.round(roll.dmg * 1.6);
        wHp = Math.max(0, wHp - counter);
        setWildHp(wHp);
        flashWild();
        await say(`${character.name} revida com ${counter} de dano!`);
      }
    }

    if (pFirst) {
      await playerAct();
      if (wHp > 0 && pHp > 0) await wildAct();
    } else {
      await wildAct();
      if (!revidar && wHp > 0 && pHp > 0) await playerAct();
    }

    setResonanceEnergy(resEnergy);
    setResonanceCount(resCount);

    if (pHp <= 0) { applyDefeat(); setResult({ type: 'derrota' }); setBusy(false); return; }
    if (wHp <= 0) { await say(`${species.name} está fraco demais para continuar lutando!`); setBusy(false); return; }

    const [pSt2, pDot, pMsgs] = tickStatuses(pSt, character.name, character.maxHp);
    const [wSt2, wDot, wMsgs] = tickStatuses(wSt, species.name, wildMaxHp);
    if (pDot > 0) { pHp = Math.max(0, pHp - pDot); setPlayerHp(pHp); }
    if (wDot > 0) { wHp = Math.max(0, wHp - wDot); setWildHp(wHp); }
    setPlayerStatuses(pSt2);
    setWildStatuses(wSt2);
    if (pMsgs.length || wMsgs.length) await say([...wMsgs, ...pMsgs].join(' '));

    if (pHp <= 0) { applyDefeat(); setResult({ type: 'derrota' }); }

    onUpdateCharacter((current) => ({ ...current, hp: pHp }));
    setBusy(false);
  }

  if (result === 'capturado') {
    return (
      <div className="app-bg w-full h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md panel rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
          <img src={species.img} alt={species.name} style={{ height: 140, objectFit: 'contain' }} />
          <h2 className="font-display text-xl text-gold">Capturado!</h2>
          <p className="text-sm text-parchment">{species.name} (Nv. {wild.level}) agora é seu Familiar.</p>
          <button onClick={onEnd} className="btn-primary">Continuar</button>
        </div>
      </div>
    );
  }
  if (result === 'fugiu') {
    return (
      <div className="app-bg w-full h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md panel rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
          <ArrowLeft size={32} className="text-muted" />
          <h2 className="font-display text-xl text-parchment">Ele fugiu...</h2>
          <button onClick={onEnd} className="btn-primary">Voltar</button>
        </div>
      </div>
    );
  }
  if (result === 'derrota') {
    return (
      <div className="app-bg w-full h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md panel rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
          <Skull size={36} className="text-crimson" />
          <h2 className="font-display text-xl text-crimson">Derrota...</h2>
          <p className="text-sm text-muted">{character.name} foi derrotado(a) na Fissura, mas conseguiu voltar ao vilarejo.</p>
          <button onClick={onEnd} className="btn-primary">Voltar ao Início</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg w-full h-screen flex items-center justify-center">
      <div className="w-full max-w-md h-full flex flex-col">
        <div className="px-4 pt-4 flex items-center justify-between">
          <span className="font-display text-sm text-gold">Fissura</span>
          <button onClick={onEnd} disabled={busy} className="text-tiny text-muted underline">Sair</button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
          <div className="energy-badge">{tipoLabel(species.tipo)}</div>
          <span className="font-display text-parchment text-sm">{species.name} · Nv. {wild.level}</span>
          <div className="bar-track" style={{ width: 180 }}><div className="bar-fill-hp" style={{ width: `${Math.max(0, (wildHp / wildMaxHp) * 100)}%` }} /></div>
          <span className="text-tiny text-muted">{wildHp}/{wildMaxHp}</span>
          <div className="flex gap-1 flex-wrap justify-center">
            {wildStatuses.filter((s) => s.type !== 'imune_atordoado').map((s) => <span key={s.type} className={`tag-pill status-pill-${s.type}`}>{STATUS_LABELS[s.type]}</span>)}
          </div>
          <div className="sprite-stage mt-1">
            <img src={species.img} alt={species.name} className={wildHit ? 'sprite-shake' : ''} style={{ height: 160 }} />
            <div className={`sprite-flash-mask ${wildHit ? 'active' : ''}`} style={{ WebkitMaskImage: `url(${species.img})`, maskImage: `url(${species.img})` }} />
          </div>
        </div>

        <div className={`px-4 pb-2 ${playerHit ? 'sprite-shake' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-tiny text-parchment">{character.name}</span>
            <div className="bar-track flex-1"><div className="bar-fill-hp" style={{ width: `${Math.max(0, (playerHp / character.maxHp) * 100)}%` }} /></div>
            <span className="text-tiny text-muted">{playerHp}/{character.maxHp}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-tiny text-muted">RD</span>
            <div className="bar-track flex-1"><div className="bar-fill-rd" style={{ width: `${(rd / playerLvlStats.rd) * 100}%` }} /></div>
            <span className="text-tiny text-muted">{rd}/{playerLvlStats.rd}</span>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="panel rounded-xl p-3" style={{ minHeight: 52 }}><p className="text-xs text-parchment">{log}</p></div>
        </div>

        <div className="px-4 pb-4">
          {menu === 'main' && (
            <div className="grid grid-cols-5 gap-1">
              <button disabled={busy} onClick={() => act('ataque')} className="action-btn"><Sword size={18} className="text-gold" /><span className="text-tiny">Atacar</span></button>
              <button disabled={busy || weaponAttacks.length === 0} onClick={() => setMenu('weapon')} className="action-btn"><Axe size={18} className="text-gold" /><span className="text-tiny">Arma</span></button>
              <button disabled={busy || abilities.length === 0} onClick={() => setMenu('abilities')} className="action-btn"><Sparkles size={18} className="text-gold" /><span className="text-tiny">Skill</span></button>
              <button disabled={busy} onClick={() => setMenu('items')} className="action-btn"><Package size={18} className="text-gold" /><span className="text-tiny">Item</span></button>
              <button disabled={busy} onClick={() => act('capturar')} className="action-btn"><Gem size={18} className="text-gold" /><span className="text-tiny">Capturar</span></button>
            </div>
          )}
          {menu === 'weapon' && (
            <div className="flex flex-col gap-2">
              <div className="panel rounded-xl p-3">
                <div className="flex items-center justify-between"><p className="text-sm text-gold font-semibold">{weapon?.name || 'Sem arma'}</p><span className="energy-badge">{tipoLabel(weapon?.energiaId || 'terra')}</span></div>
                <p className="text-tiny text-muted mt-1">Ataque básico grátis · builder de Ressonância.</p>
              </div>
              {weaponAttacks.map((a) => {
                const rdCost = custoRD(a, character.typeId);
                const sealed = a.categoria !== 'fisica' && hasStatus(playerStatuses, 'selado');
                const disabled = busy || rdCost > rd || sealed;
                const estDmg = Math.round(baseDamage(playerLvlStats, a, { def: wildStats.def, bld: wildStats.bld }));
                return <button key={a.id} disabled={disabled} onClick={() => act('weapon', a)} className="panel rounded-xl p-3 text-left" style={disabled ? { opacity: 0.45 } : {}}><div className="flex justify-between gap-2"><span className="text-sm text-parchment font-semibold">{a.name}</span><span className="text-tiny text-gold">{rdCost} RD</span></div><p className="text-tiny text-muted mt-1">Dano base: {estDmg}{sealed ? ' · Selada' : ''}</p></button>;
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
                const estDmg = a.isRevidar ? null : Math.round(baseDamage(playerLvlStats, a, { def: wildStats.def, bld: wildStats.bld }));
                return (
                  <div key={a.id} className="panel rounded-xl p-3" style={disabled ? { opacity: 0.45 } : {}}>
                    <div className="flex items-center gap-2">
                      <button disabled={disabled} onClick={() => act('ability', a)} className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gold font-semibold">{a.name}</p>
                          <p className="text-xs text-parchment">{estDmg !== null ? `Dano base: ${estDmg}` : 'Contra-ataque'}</p>
                        </div>
                        {rdCost > 0 && <span className="text-tiny text-muted">{rdCost} RD</span>}
                      </button>
                    </div>
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
