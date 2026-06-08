import { useState, useEffect, useRef } from 'react';
import { usePlayers } from '../../context/PlayersContext';
import { POS_LABEL } from '../../data/players';
import type { Player, Position, LineupState } from '../../types';

interface Props {
  pos: Position | '__mvp__' | null;
  state: LineupState;
  onSelect: (player: Player) => void;
  onClose: () => void;
}

const SECTIONS = [
  { label: 'Porteros',        key: 'porteros'        as const, tag: 'POR' },
  { label: 'Defensas',        key: 'defensas'        as const, tag: 'DEF' },
  { label: 'Centrocampistas', key: 'centrocampistas' as const, tag: 'MC'  },
  { label: 'Delanteros',      key: 'delanteros'      as const, tag: 'DEL' },
];

export function PlayerModal({ pos, state, onSelect, onClose }: Props) {
  const { plantilla } = usePlayers();
  const [query, setQuery] = useState('');
  const open = pos !== null;
  const openTimeRef = useRef(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      openTimeRef.current = Date.now();
    }
  }, [open, pos]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const isMvp = pos === '__mvp__';
  const title = isMvp ? '🌟 Elige el MVP' : `Elige · ${POS_LABEL[pos as string] ?? pos}`;

  return (
    <div className={`modal-bg${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel">
        <span className="modal-drag" />
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-search-wrap">
          <input
            className="modal-search"
            type="text"
            placeholder="Buscar por nombre o dorsal…"
            value={query}
            onChange={e => setQuery(e.target.value.toLowerCase())}
            autoFocus={open}
          />
        </div>
        <div className="modal-list">
          {SECTIONS.map(sec => {
            const filtered = plantilla[sec.key].filter(
              p => p.n.toLowerCase().includes(query) || String(p.d).includes(query)
            );
            if (!filtered.length) return null;
            return (
              <div key={sec.key}>
                <div className="mgroup-title">{sec.label}</div>
                {filtered.map(p => {
                  const sel = isMvp
                    ? state.mvp?.d === p.d
                    : state.picked[pos as Position]?.d === p.d;
                  return (
                    <div key={p.d} className={`mrow${sel ? ' sel' : ''}`} onClick={() => { if (Date.now() - openTimeRef.current < 400) return; onSelect(p); }}>
                      <div className="mrow-num">{p.d}</div>
                      <div className="mrow-info">
                        <div className="mrow-name">{p.n}</div>
                        <div className="mrow-tag">{sec.tag}</div>
                      </div>
                      <div className="mrow-check">✓</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
