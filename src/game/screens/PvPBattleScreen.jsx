import React, { useState } from 'react';
import { Sword, Skull, Sparkles, Trophy, ArrowLeft, Axe } from 'lucide-react';
import {
  custoRD,
  precisaoPenaltyApice,
  hp,
  avatarForCharacter,
  getPlayerStats,
  getBattleAbilities,
  getEquippedWeapon,
  makeWeaponBasicAttack,
  getWeaponAttacks,
  STATUS_LABELS,
  PVP_KEY_PREFIX,
  sleep,
  baseDamage,
  rollDamage,
  applyStatus,
  hasStatus,
  slowMult,
  tickStatuses,
  effectMessage,
  tipoLabel
} from '../data/core.js';

function pvpAiChoose(abilities, weaponAttacks, energia, oppRd) {
  const options = [{ type: 'ataque' }];
  for (const a of abilities) {
    if (custoRD(a, energia) <= oppRd) options.push({ type: 'ability', ability: a });
  }
  for (const a of weaponAttacks) {
    if (custoRD(a, energia) <= oppRd) options.push({ type: 'weapon', ability: a });
  }
  return options[Math.floor(Math.random() * options.length)];
}

export function PvPBattleScreen({ character, avatar, opponent, onUpdateCharacter, onEnd }) {
  const playerLvlStats = getPlayerStats(character);
  const oppCharacter = pvpCharacterFromRecord(opponent);
  const oppAvatar = avatarForCharacter(oppCharacter);
  const oppLvlStats = getPlayerStats(oppCharacter);
  const oppAbilities = getBattleAbilities(oppCharacter);
  const oppWeaponBasic = makeWeaponBasicAttack(oppCharacter);
  const oppWeaponAttacks = getWeaponAttacks(oppCharacter);
  const playerMaxHp = character.maxHp;
  const oppMaxHp = hp(oppLvlStats.vit);

  const [playerHp, setPlayerHp] = useState(playerMaxHp);
  const [oppHp, setOppHp] = useState(oppMaxHp);
  const [rd, setRd] = useState(playerLvlStats.rd);
  const [oppRd, setOppRd] = useState(oppLvlStats.rd);
  const [playerStatuses, setPlayerStatuses] = useState([]);
  const [oppStatuses, setOppStatuses] = useState([]);
  const [pResEnergy, setPResEnergy] = useState(null);
  const [pResCount, setPResCount] = useState(0);
  const [oResEnergy, setOResEnergy] = useState(null);
  const [oResCount, setOResCount] = useState(0);
  const [log, setLog] = useState(`O duelo contra ${opponent.name} começou!`);
  const [menu, setMenu] = useState('main');
  const [oppHit, setOppHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const abilities = getBattleAbilities(character);
  const weapon = getEquippedWeapon(character);
  const weaponBasic = makeWeaponBasicAttack(character);
  const weaponAttacks = getWeaponAttacks(character);

  function flashOpp() { setOppHit(true); setTimeout(() => setOppHit(false), 450); }
  function flashPlayer() { setPlayerHit(true); setTimeout(() => setPlayerHit(false), 450); }
  async function say(msg, delay = 750) { setLog(msg); await sleep(delay); }

  async function recordResult(won) {
    onUpdateCharacter({ ...character, hp: character.maxHp, pvpWins: (character.pvpWins || 0) + (won ? 1 : 0), pvpLosses: (character.pvpLosses || 0) + (won ? 0 : 1) });
    try {
      const r = await window.storage.get(PVP_KEY_PREFIX + opponent.name, true);
      const oppRecord = r?.value ? JSON.parse(r.value) : { ...opponent };
      oppRecord.wins = (oppRecord.wins || 0) + (won ? 0 : 1);
      oppRecord.losses = (oppRecord.losses || 0) + (won ? 1 : 0);
      oppRecord.updatedAt = Date.now();
      await window.storage.set(PVP_KEY_PREFIX + opponent.name, JSON.stringify(oppRecord), true);
    } catch (e) {}
  }

  async function act(actionType, ability) {
    if (busy || result) return;
    const isSkillAction = actionType === 'ability' || actionType === 'weapon';
    const usedAbility0 = actionType === 'ataque' ? weaponBasic : isSkillAction ? ability : null;
    const rdCost0 = isSkillAction ? custoRD(ability, character.typeId) : 0;
    if (!usedAbility0) return;
    if (rdCost0 > rd) return;
    setBusy(true);
    setMenu('main');

    let pHp = playerHp, oHp = oppHp;
    let pSt = [...playerStatuses], oSt = [...oppStatuses];
    let localRd = rd, localOppRd = oppRd;
    let pResE = pResEnergy, pResC = pResCount;
    let oResE = oResEnergy, oResC = oResCount;

    const revidar = isSkillAction && ability?.isRevidar;
    const oppChoice = pvpAiChoose(oppAbilities, oppWeaponAttacks, oppCharacter.typeId, localOppRd);
    const oppRevidar = oppChoice.type !== 'ataque' && oppChoice.ability?.isRevidar;

    let pFirst = (playerLvlStats.spd * slowMult(pSt)) >= (oppLvlStats.spd * slowMult(oSt));
    if (ability?.alwaysFirst) pFirst = true;
    if (oppChoice.ability?.alwaysFirst) pFirst = false;

    function updateRes(setE, setC, curE, curC, usedAbility) {
      if (!usedAbility?.energiaId) return [curE, curC];
      if (curE === usedAbility.energiaId) return [curE, curC + 1];
      return [usedAbility.energiaId, 1];
    }

    async function playerAct() {
      if (hasStatus(pSt, 'atordoado')) {
        pSt = pSt.filter((s) => s.type !== 'atordoado');
        pSt = applyStatus(pSt, { type: 'imune_atordoado', duration: 1 });
        await say(`${character.name} está atordoado(a) e perde o turno!`);
        return;
      }
      if (revidar) { await say(`${character.name} assume postura defensiva, pronto para revidar!`); return; }
      const usedAbility = actionType === 'ataque' ? weaponBasic : ability;
      const rdCost = isSkillAction ? custoRD(usedAbility, character.typeId) : 0;
      if (rdCost) { localRd -= rdCost; setRd(localRd); }
      const precisaoMult = isSkillAction ? precisaoPenaltyApice(usedAbility, character.typeId) : 1;
      const actionResCount = usedAbility.energiaId ? (pResE === usedAbility.energiaId ? pResC + 1 : 1) : 0;
      const roll = rollDamage(playerLvlStats, usedAbility, { def: oppLvlStats.def, bld: oppLvlStats.bld }, usedAbility.energiaId || null, oppCharacter.typeId, actionResCount, precisaoMult, oppLvlStats.spd * slowMult(oSt));
      const label = usedAbility.name;
      if (!roll.hit) { await say(`${character.name} usa ${label} e erra o golpe!`); [pResE, pResC] = updateRes(setPResEnergy, setPResCount, pResE, pResC, usedAbility); return; }
      oHp = Math.max(0, oHp - roll.dmg);
      setOppHp(oHp);
      flashOpp();
      const tag = roll.isCrit ? ' — CRÍTICO!' : roll.typeM > 1 ? ' (vantagem elemental!)' : roll.typeM < 1 ? ' (desvantagem elemental)' : '';
      await say(`${character.name} usa ${label} e causa ${roll.dmg} de dano${tag}`);
      [pResE, pResC] = updateRes(setPResEnergy, setPResCount, pResE, pResC, usedAbility);
      if (oHp <= 0) return;
      if (usedAbility.effect && Math.random() < usedAbility.effect.chance) {
        if (!(usedAbility.effect.type === 'atordoado' && hasStatus(oSt, 'imune_atordoado'))) {
          oSt = applyStatus(oSt, usedAbility.effect);
          await say(effectMessage(opponent.name, usedAbility.effect));
        }
      }
    }

    async function oppAct() {
      if (hasStatus(oSt, 'atordoado')) {
        oSt = oSt.filter((s) => s.type !== 'atordoado');
        oSt = applyStatus(oSt, { type: 'imune_atordoado', duration: 1 });
        await say(`${opponent.name} está atordoado e perde o turno!`);
        return;
      }
      if (oppRevidar) { await say(`${opponent.name} assume postura defensiva, pronto para revidar!`); return; }
      const usedAbility = oppChoice.type === 'ataque' ? oppWeaponBasic : oppChoice.ability;
      const rdCost = oppChoice.type === 'ataque' ? 0 : custoRD(usedAbility, oppCharacter.typeId);
      if (rdCost) { localOppRd -= rdCost; setOppRd(localOppRd); }
      const precisaoMult = oppChoice.type === 'ataque' ? 1 : precisaoPenaltyApice(usedAbility, oppCharacter.typeId);
      const actionResCount = usedAbility.energiaId ? (oResE === usedAbility.energiaId ? oResC + 1 : 1) : 0;
      const roll = rollDamage(oppLvlStats, usedAbility, { def: playerLvlStats.def, bld: playerLvlStats.bld }, usedAbility.energiaId || null, character.typeId, actionResCount, precisaoMult, playerLvlStats.spd * slowMult(pSt));
      const label = usedAbility.name;
      if (!roll.hit) { await say(`${opponent.name} usa ${label} e erra o golpe!`); [oResE, oResC] = updateRes(setOResEnergy, setOResCount, oResE, oResC, usedAbility); return; }
      pHp = Math.max(0, pHp - roll.dmg);
      setPlayerHp(pHp);
      flashPlayer();
      const tag = roll.isCrit ? ' — CRÍTICO!' : '';
      await say(`${opponent.name} usa ${label} e causa ${roll.dmg} de dano${tag}`);
      [oResE, oResC] = updateRes(setOResEnergy, setOResCount, oResE, oResC, usedAbility);
      if (revidar && pHp > 0) {
        const counter = Math.round(roll.dmg * 1.6);
        oHp = Math.max(0, oHp - counter);
        setOppHp(oHp);
        flashOpp();
        await say(`${character.name} revida com ${counter} de dano!`);
      }
      if (pHp <= 0) return;
      if (usedAbility.effect && Math.random() < usedAbility.effect.chance) {
        if (!(usedAbility.effect.type === 'atordoado' && hasStatus(pSt, 'imune_atordoado'))) {
          pSt = applyStatus(pSt, usedAbility.effect);
          await say(effectMessage(character.name, usedAbility.effect));
        }
      }
    }

    if (pFirst) {
      await playerAct();
      if (oHp > 0 && pHp > 0) await oppAct();
    } else {
      await oppAct();
      if (!revidar && oHp > 0 && pHp > 0) await playerAct();
    }

    setPResEnergy(pResE); setPResCount(pResC);
    setOResEnergy(oResE); setOResCount(oResC);

    if (oHp <= 0) { await say(`Você venceu o duelo contra ${opponent.name}!`, 600); await recordResult(true); setResult('vitoria'); setBusy(false); return; }
    if (pHp <= 0) { await say(`Você foi derrotado(a) por ${opponent.name}.`, 600); await recordResult(false); setResult('derrota'); setBusy(false); return; }

    const [pSt2, pDot, pMsgs] = tickStatuses(pSt, character.name, playerMaxHp);
    const [oSt2, oDot, oMsgs] = tickStatuses(oSt, opponent.name, oppMaxHp);
    if (pDot > 0) { pHp = Math.max(0, pHp - pDot); setPlayerHp(pHp); }
    if (oDot > 0) { oHp = Math.max(0, oHp - oDot); setOppHp(oHp); }
    setPlayerStatuses(pSt2);
    setOppStatuses(oSt2);
    if (pMsgs.length || oMsgs.length) await say([...oMsgs, ...pMsgs].join(' '));

    if (oHp <= 0) { await recordResult(true); setResult('vitoria'); }
    else if (pHp <= 0) { await recordResult(false); setResult('derrota'); }

    setBusy(false);
  }

  if (result === 'vitoria' || result === 'derrota') {
    const won = result === 'vitoria';
    return (
      <div className="app-bg w-full h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md panel rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
          {won ? <Trophy size={36} className="text-gold" /> : <Skull size={36} className="text-crimson" />}
          <h2 className={`font-display text-xl ${won ? 'text-gold' : 'text-crimson'}`}>{won ? 'Vitória!' : 'Derrota...'}</h2>
          <p className="text-sm text-parchment">{won ? `Você venceu ${opponent.name}!` : `${opponent.name} venceu esse duelo.`}</p>
          <button onClick={onEnd} className="btn-primary">Continuar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg w-full h-screen flex items-center justify-center">
      <div className="w-full max-w-md h-full flex flex-col">
        <div className="px-4 pt-4 flex items-center justify-between">
          <span className="font-display text-sm text-gold">Duelo</span>
          <button onClick={onEnd} disabled={busy} className="text-tiny text-muted underline">Sair</button>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3 px-3">
          <div className="combatant-row">
            <div className="combatant-side">
              <span className="text-tiny text-parchment">{character.name}</span>
              <div className="bar-track w-full"><div className="bar-fill-hp" style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }} /></div>
              <span className="text-tiny text-muted">{playerHp}/{playerMaxHp}</span>
              <div className="bar-track w-full"><div className="bar-fill-rd" style={{ width: `${(rd / playerLvlStats.rd) * 100}%` }} /></div>
              <div className="flex gap-1 flex-wrap justify-center">
                {playerStatuses.filter((s) => s.type !== 'imune_atordoado').map((s) => <span key={s.type} className={`tag-pill status-pill-${s.type}`}>{STATUS_LABELS[s.type]}</span>)}
              </div>
            </div>
            <span className="vs-mark">VS</span>
            <div className="combatant-side">
              <span className="text-tiny text-parchment">{opponent.name}</span>
              <div className="bar-track w-full"><div className="bar-fill-hp" style={{ width: `${Math.max(0, (oppHp / oppMaxHp) * 100)}%` }} /></div>
              <span className="text-tiny text-muted">{oppHp}/{oppMaxHp}</span>
              <div className="bar-track w-full"><div className="bar-fill-rd" style={{ width: `${(oppRd / oppLvlStats.rd) * 100}%` }} /></div>
              <div className="flex gap-1 flex-wrap justify-center">
                {oppStatuses.filter((s) => s.type !== 'imune_atordoado').map((s) => <span key={s.type} className={`tag-pill status-pill-${s.type}`}>{STATUS_LABELS[s.type]}</span>)}
              </div>
            </div>
          </div>

          <div className="combatant-row items-end">
            <div className="sprite-stage">
              <img src={avatar} alt={character.name} className={playerHit ? 'sprite-shake' : ''} style={{ height: 160 }} />
              <div className={`sprite-flash-mask ${playerHit ? 'active' : ''}`} style={{ WebkitMaskImage: `url(${avatar})`, maskImage: `url(${avatar})` }} />
            </div>
            <div className="sprite-stage">
              <img src={oppAvatar} alt={opponent.name} className={oppHit ? 'sprite-shake' : ''} style={{ height: 160 }} />
              <div className={`sprite-flash-mask ${oppHit ? 'active' : ''}`} style={{ WebkitMaskImage: `url(${oppAvatar})`, maskImage: `url(${oppAvatar})` }} />
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
              <button disabled={busy} onClick={onEnd} className="action-btn"><ArrowLeft size={18} className="text-gold" /><span className="text-tiny">Desistir</span></button>
            </div>
          )}
          {menu === 'weapon' && (
            <div className="flex flex-col gap-2">
              <div className="panel rounded-xl p-3"><div className="flex justify-between gap-2"><span className="text-sm text-gold font-semibold">{weapon?.name || 'Sem arma'}</span><span className="energy-badge">{tipoLabel(weapon?.energiaId || 'terra')}</span></div><p className="text-tiny text-muted mt-1">Ataque básico grátis · builder de Ressonância.</p></div>
              {weaponAttacks.map((a) => {
                const rdCost = custoRD(a, character.typeId);
                const sealed = a.categoria !== 'fisica' && hasStatus(playerStatuses, 'selado');
                const disabled = busy || rdCost > rd || sealed;
                const estDmg = Math.round(baseDamage(playerLvlStats, a, { def: oppLvlStats.def, bld: oppLvlStats.bld }));
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
                const estDmg = a.isRevidar ? null : Math.round(baseDamage(playerLvlStats, a, { def: oppLvlStats.def, bld: oppLvlStats.bld }));
                return (
                  <div key={a.id} className="panel rounded-xl p-3" style={disabled ? { opacity: 0.45 } : {}}>
                    <button disabled={disabled} onClick={() => act('ability', a)} className="w-full text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gold font-semibold">{a.name}</p>
                        <p className="text-xs text-parchment">{estDmg !== null ? `Dano base: ${estDmg}` : 'Contra-ataque'}</p>
                      </div>
                      {rdCost > 0 && <span className="text-tiny text-muted">{rdCost} RD</span>}
                    </button>
                  </div>
                );
              })}
              <button onClick={() => setMenu('main')} className="btn-secondary flex items-center justify-center gap-2"><ArrowLeft size={14} /> Voltar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
