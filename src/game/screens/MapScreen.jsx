import React, { useState } from 'react';
import { Landmark, Sparkles } from 'lucide-react';
import { ExploreScreen } from './HomeScreens.jsx';

export function MapScreen({ onEnterZone, onEnterFissura }) {
  const [tab, setTab] = useState('explorar');
  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex gap-2">
        <button onClick={() => setTab('explorar')} className={`btn-secondary flex-1 ${tab !== 'explorar' ? 'opacity-50' : ''}`}>Explorar</button>
        <button onClick={() => setTab('dungeons')} className={`btn-secondary flex-1 ${tab !== 'dungeons' ? 'opacity-50' : ''}`}>Dungeons</button>
        <button onClick={() => setTab('fissura')} className={`btn-secondary flex-1 ${tab !== 'fissura' ? 'opacity-50' : ''}`}>Fissura</button>
      </div>
      {tab === 'explorar' && <ExploreScreen onEnter={onEnterZone} />}
      {tab === 'dungeons' && (
        <div className="panel rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
          <Landmark size={28} className="text-muted" />
          <p className="text-sm text-parchment font-semibold">Dungeons</p>
          <p className="text-tiny text-muted">Masmorras com múltiplos andares chegam em breve.</p>
        </div>
      )}
      {tab === 'fissura' && (
        <div className="panel rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <Sparkles size={28} className="text-gold" />
          <p className="text-sm text-parchment font-semibold">Fissura</p>
          <p className="text-tiny text-muted">Uma fenda instável onde Familiares selvagens aparecem. Enfraqueça-os para ter mais chance de capturar.</p>
          <button onClick={onEnterFissura} className="btn-primary" style={{ width: 'auto', padding: '10px 28px' }}>Entrar na Fissura</button>
        </div>
      )}
    </div>
  );
}
