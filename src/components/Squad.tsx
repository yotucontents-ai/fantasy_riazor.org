import { useEffect, useRef, useState } from 'react';
import { PLANTILLA } from '../data/players';
import { showToast } from './Toast';
import { pickFromSquadFn } from './myEleven/MyEleven';
import type { Player, PlayerCategory } from '../types';

const TABS: { key: PlayerCategory | 'todos'; label: string }[] = [
  { key: 'todos',           label: 'Todos'            },
  { key: 'porteros',        label: 'Porteros'         },
  { key: 'defensas',        label: 'Defensas'         },
  { key: 'centrocampistas', label: 'Centrocampistas'  },
  { key: 'delanteros',      label: 'Delanteros'       },
];

const CAT_TAG: Record<PlayerCategory, string> = {
  porteros: 'POR',
  defensas: 'DEF',
  centrocampistas: 'MC',
  delanteros: 'DEL',
};

export function Squad() {
  const [activeTab, setActiveTab] = useState<PlayerCategory | 'todos'>('todos');
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    el.querySelectorAll('.reveal').forEach(r => obs.observe(r));
    return () => obs.disconnect();
  }, []);

  const players: Player[] = activeTab === 'todos'
    ? Object.values(PLANTILLA).flat()
    : PLANTILLA[activeTab];

  function handleCardClick(player: Player) {
    if (pickFromSquadFn) {
      pickFromSquadFn(player);
    } else {
      showToast('Sube al campo para asignar jugadores', 'warn');
    }
  }

  return (
    <section id="plantilla" ref={ref}>
      <div className="section-eyebrow reveal">RC Deportivo de La Coruña</div>
      <h2 className="section-title reveal" style={{ transitionDelay: '.05s' }}>Plantilla 2025/26</h2>
      <p className="section-sub reveal" style={{ transitionDelay: '.1s' }}>
        Plantilla oficial. Haz clic en cualquier jugador para asignarlo a una posición en tu once.
      </p>

      <div className="plantilla-tabs reveal" style={{ transitionDelay: '.12s' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`ptab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="player-grid reveal" style={{ transitionDelay: '.15s' }}>
        {players.map(p => (
          <div key={p.d} className="player-card" onClick={() => handleCardClick(p)}>
            <div className="player-num">{p.d}</div>
            <div className="player-info">
              <div className="player-name">{p.n}</div>
              <div className="player-pos">{CAT_TAG[p.cat]}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
