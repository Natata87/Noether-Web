import React, { useEffect, useState } from 'react';
import { Swords, Coins, Trophy, X } from 'lucide-react';
import {
  ENERGY_TREE,
  hp,
  DEFAULT_WEAPON_ID,
  avatarForCharacter,
  getPlayerStats,
  getEquippedWeapon,
  migrateCharacter,
  RARITY,
  ITEMS,
  ITEM_CATEGORIES,
  RARITY_SELL_MULT,
  SHOP_ROTATION_MS,
  generateShopStock,
  addToInventory,
  MARKET_LISTINGS,
  PVP_KEY_PREFIX
} from '../data/core.js';

export function ShopScreen({ shopTab, setShopTab, character, onUpdateCharacter, showToast }) {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex gap-2">
        <button onClick={() => setShopTab('loja')} className={`btn-secondary flex-1 ${shopTab !== 'loja' ? 'opacity-50' : ''}`}>Loja</button>
        <button onClick={() => setShopTab('mercado')} className={`btn-secondary flex-1 ${shopTab !== 'mercado' ? 'opacity-50' : ''}`}>Mercado</button>
      </div>
      {shopTab === 'loja' ? (
        <LojaScreen character={character} onUpdateCharacter={onUpdateCharacter} showToast={showToast} />
      ) : (
        <div className="flex flex-col gap-3">
          {MARKET_LISTINGS.map((listing) => (
            <div key={listing.id} className="market-card p-3 flex items-center gap-3">
              <div className="flex-1"><span className="text-sm text-parchment">{listing.item}</span><p className="text-tiny text-muted">Vendido por {listing.seller}</p></div>
              <div className="flex items-center gap-1"><Coins size={13} className="text-gold" /><span className="text-xs text-gold">{listing.price}</span></div>
              <button onClick={() => showToast('Mercado entre jogadores ainda não está pronto')} className="btn-secondary">Comprar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LojaScreen({ character, onUpdateCharacter, showToast }) {
  const [cat, setCat] = useState('todos');
  const [section, setSection] = useState('comprar');
  const [stock, setStock] = useState(null);
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    (async () => {
      let fresh = null;
      try {
        const result = await window.storage.get('shop_stock', false);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (Date.now() - parsed.generatedAt < SHOP_ROTATION_MS) fresh = parsed;
        }
      } catch (e) {}
      if (!fresh) {
        fresh = generateShopStock();
        window.storage.set('shop_stock', JSON.stringify(fresh), false).catch(() => {});
      }
      setStock(fresh);
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!stock) return;
    if (now - stock.generatedAt >= SHOP_ROTATION_MS) {
      const fresh = generateShopStock();
      setStock(fresh);
      setSelected(null);
      window.storage.set('shop_stock', JSON.stringify(fresh), false).catch(() => {});
    }
  }, [now, stock]);

  if (!stock) {
    return <div className="panel rounded-2xl p-4 text-center"><p className="text-sm text-muted">Carregando estoque...</p></div>;
  }

  function persistStock(next) {
    setStock(next);
    window.storage.set('shop_stock', JSON.stringify(next), false).catch(() => {});
  }

  function buy(itemId, q) {
    const item = ITEMS[itemId];
    const available = stock.items[itemId] || 0;
    const amt = Math.min(q, available);
    if (amt <= 0) return;
    const cost = item.price * amt;
    if (character.sc < cost) { showToast('SC insuficiente'); return; }
    const nextInv = addToInventory(character.inventory || {}, itemId, amt);
    const nextItems = { ...stock.items, [itemId]: available - amt };
    if (nextItems[itemId] <= 0) delete nextItems[itemId];
    onUpdateCharacter({ ...character, sc: character.sc - cost, inventory: nextInv });
    persistStock({ ...stock, items: nextItems });
    showToast(`Comprou ${amt}x ${item.name}!`);
    setSelected(null);
  }

  function sell(itemId, q) {
    const item = ITEMS[itemId];
    const owned = character.inventory?.[itemId] || 0;
    const amt = Math.min(q, owned);
    if (amt <= 0) return;
    const gain = Math.round(item.price * RARITY_SELL_MULT) * amt;
    const nextInv = { ...(character.inventory || {}) };
    nextInv[itemId] = owned - amt;
    onUpdateCharacter({ ...character, sc: character.sc + gain, inventory: nextInv });
    showToast(`Vendeu ${amt}x ${item.name} por ${gain} SC!`);
    setSelected(null);
  }

  const msLeft = Math.max(0, SHOP_ROTATION_MS - (now - stock.generatedAt));
  const minLeft = Math.floor(msLeft / 60000);
  const secLeft = Math.floor((msLeft % 60000) / 1000);

  const listIds = section === 'comprar' ? Object.keys(stock.items) : Object.keys(character.inventory || {}).filter((id) => (character.inventory[id] || 0) > 0);
  const filteredIds = listIds.filter((id) => cat === 'todos' || ITEMS[id].category === cat);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => { setSection('comprar'); setSelected(null); }} className={`btn-secondary ${section !== 'comprar' ? 'opacity-50' : ''}`}>Comprar</button>
          <button onClick={() => { setSection('vender'); setSelected(null); }} className={`btn-secondary ${section !== 'vender' ? 'opacity-50' : ''}`}>Vender</button>
        </div>
        {section === 'comprar' && <span className="text-tiny text-muted">Novo estoque em {minLeft}:{String(secLeft).padStart(2, '0')}</span>}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setCat('todos')} className={`cat-pill ${cat === 'todos' ? 'cat-pill-active' : ''}`}>Todos</button>
        {ITEM_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`cat-pill ${cat === c.id ? 'cat-pill-active' : ''}`}>{c.label}</button>
        ))}
      </div>

      {filteredIds.length === 0 ? (
        <div className="panel rounded-2xl p-4 text-center"><p className="text-sm text-muted">{section === 'comprar' ? 'Nada dessa categoria no estoque agora.' : 'Você não tem itens dessa categoria pra vender.'}</p></div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredIds.map((id) => {
            const item = ITEMS[id];
            const rarity = RARITY[item.rarity];
            const qtyLabel = section === 'comprar' ? stock.items[id] : character.inventory[id];
            const price = section === 'comprar' ? item.price : Math.round(item.price * RARITY_SELL_MULT);
            return (
              <button key={id} onClick={() => setSelected(id)} className="shop-card p-3 flex items-center gap-3 text-left">
                {item.img ? <img src={item.img} alt={item.name} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <item.Icon size={22} className="text-gold" />}
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: rarity.className === 'rarity-lendario' ? 'var(--gold)' : undefined }}>{item.name}</span>
                  <p className="text-tiny text-muted">Estoque: {qtyLabel}</p>
                </div>
                <div className="flex items-center gap-1"><Coins size={13} className="text-gold" /><span className="text-xs text-gold">{price}</span></div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ShopItemModal
          item={ITEMS[selected]}
          rarity={RARITY[ITEMS[selected].rarity]}
          section={section}
          maxQty={section === 'comprar' ? stock.items[selected] : character.inventory[selected]}
          unitPrice={section === 'comprar' ? ITEMS[selected].price : Math.round(ITEMS[selected].price * RARITY_SELL_MULT)}
          sc={character.sc}
          onConfirm={(q) => (section === 'comprar' ? buy(selected, q) : sell(selected, q))}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export function ShopItemModal({ item, rarity, section, maxQty, unitPrice, sc, onConfirm, onClose }) {
  const [qty, setQty] = useState(1);
  const total = qty * unitPrice;
  const canConfirm = qty > 0 && qty <= maxQty && (section === 'vender' || sc >= total);
  return (
    <div className="modal-backdrop">
      <div className="panel rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="tag-pill text-gold">{rarity.label}</span>
          <button onClick={onClose}><X size={18} className="text-muted" /></button>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          {item.img ? <img src={item.img} alt={item.name} style={{ height: 64, objectFit: 'contain' }} /> : <item.Icon size={40} className="text-gold" />}
          <span className="font-display text-parchment">{item.name}</span>
          <p className="text-tiny text-muted">{item.desc}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{section === 'comprar' ? 'Estoque disponível' : 'Você tem'}: {maxQty}</span>
          <span>Preço unitário: {unitPrice} SC</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="btn-secondary" style={{ padding: '8px 16px' }}>-</button>
          <span className="font-display text-gold text-lg">{qty}</span>
          <button onClick={() => setQty(Math.min(maxQty, qty + 1))} className="btn-secondary" style={{ padding: '8px 16px' }}>+</button>
        </div>
        <button disabled={!canConfirm} onClick={() => onConfirm(qty)} className="btn-primary flex items-center justify-center gap-2" style={!canConfirm ? { opacity: 0.5 } : {}}>
          <Coins size={16} />{section === 'comprar' ? `Comprar por ${total} SC` : `Vender por ${total} SC`}
        </button>
      </div>
    </div>
  );
}

export function makePvPRecord(character) {
  return {
    name: character.name,
    gender: character.gender,
    level: character.level,
    typeId: character.typeId,
    classId: character.classId,
    avatarStyle: character.avatarStyle,
    baseStats: character.baseStats,
    attributeAllocations: character.attributeAllocations || {},
    learnedAbilityIds: character.learnedAbilityIds || [],
    equippedAbilityIds: character.equippedAbilityIds || [],
    equippedWeaponId: character.equippedWeaponId || DEFAULT_WEAPON_ID,
    wins: character.pvpWins || 0,
    losses: character.pvpLosses || 0,
    updatedAt: Date.now(),
  };
}

export function pvpCharacterFromRecord(record) {
  const weaponId = record.equippedWeaponId || DEFAULT_WEAPON_ID;
  const migrated = migrateCharacter({ ...record, inventory: { [weaponId]: 1 } });
  const stats = getPlayerStats(migrated);
  const maxHp = hp(stats.vit);
  return { ...migrated, maxHp, hp: maxHp };
}

export function PvPScreen({ character, onChallenge, showToast }) {
  const [roster, setRoster] = useState(null);

  useEffect(() => {
    (async () => {
      const own = makePvPRecord(character);
      try { await window.storage.set(PVP_KEY_PREFIX + character.name, JSON.stringify(own), true); } catch (e) {}

      try {
        const list = await window.storage.list(PVP_KEY_PREFIX, true);
        const keys = list?.keys || [];
        const entries = [];
        for (const k of keys) {
          try {
            const r = await window.storage.get(k, true);
            if (r && r.value) entries.push(JSON.parse(r.value));
          } catch (e) {}
        }
        setRoster(entries.length ? entries : [own]);
      } catch (e) {
        setRoster([own]);
      }
    })();
  }, []);

  if (!roster) {
    return <div className="panel rounded-2xl p-4 text-center mt-4"><p className="text-sm text-muted">Buscando outros jogadores...</p></div>;
  }

  const ranked = [...roster].sort((a, b) => (b.wins || 0) - (a.wins || 0));
  const others = roster.filter((p) => p.name !== character.name);

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="panel rounded-2xl p-4">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Ranking</p>
        <div className="flex flex-col gap-2">
          {ranked.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className={`font-display text-sm ${i === 0 ? 'text-gold' : 'text-muted'}`}>{i + 1}º</span>
              <span className={`flex-1 text-sm ${p.name === character.name ? 'text-parchment font-semibold' : 'text-muted'}`}>{p.name}</span>
              <span className="text-tiny text-muted">{p.wins || 0}V - {p.losses || 0}D</span>
              {i === 0 && <Trophy size={14} className="text-gold" />}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted uppercase tracking-wide">Desafiar</p>
      {others.length === 0 ? (
        <div className="panel rounded-2xl p-4 text-center"><p className="text-sm text-muted">Nenhum outro jogador encontrado ainda. Chame seus amigos pra criar personagem e voltar aqui!</p></div>
      ) : (
        others.map((p) => {
          const oppCharacter = pvpCharacterFromRecord(p);
          const oppAvatar = avatarForCharacter(oppCharacter);
          const oppType = ENERGY_TREE[oppCharacter.typeId] || ENERGY_TREE.terra;
          const oppWeapon = getEquippedWeapon(oppCharacter);
          return (
            <div key={p.name} className="player-card p-3 flex items-center gap-3">
              <div className="medallion" style={{ width: 40, height: 40, overflow: 'hidden' }}><img src={oppAvatar} alt={p.name} style={{ height: '115%' }} /></div>
              <div className="flex-1">
                <span className="text-sm text-parchment">{p.name}</span>
                <p className="text-tiny text-muted">Tipo {oppType.label} · {oppWeapon?.name || 'Sem arma'} · Nv. {p.level} · {p.wins || 0}V-{p.losses || 0}D</p>
              </div>
              <button onClick={() => onChallenge(p)} className="btn-secondary flex items-center gap-1"><Swords size={14} /> Desafiar</button>
            </div>
          );
        })
      )}
    </div>
  );
}
