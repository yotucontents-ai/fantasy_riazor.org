import type { LineupState, Position } from '../../types';

interface SlotProps {
  id: Position;
  cx: number;
  cy: number;
  label: string;
  state: LineupState;
  onOpen: (pos: Position) => void;
}

function Slot({ id, cx, cy, label, state, onOpen }: SlotProps) {
  const player = state.picked[id];
  const filled = !!player;
  const shortName = player ? player.n.split(' ')[0].slice(0, 9) : '—';

  return (
    <g className="pslot" onClick={() => onOpen(id)}>
      <g className="pc">
        <circle className={`slot-bg${filled ? ' filled' : ''}`} cx={cx} cy={cy} r={5.8} />
        <text className="slot-pos-text" x={cx} y={cy - 2.5}>{label}</text>
        <text className="slot-name-text" x={cx} y={cy + 2.5}>{shortName}</text>
        {filled && (
          <>
            <rect className="slot-num-bg" x={cx + 2.5} y={cy - 7} width={8} height={5.5} rx={1.5} />
            <text className="slot-num-txt" x={cx + 6.5} y={cy - 3.8}>{player.d}</text>
          </>
        )}
      </g>
    </g>
  );
}

interface Props {
  state: LineupState;
  onOpen: (pos: Position) => void;
}

const SLOTS: { id: Position; cx: number; cy: number; label: string }[] = [
  { id: 'POR',  cx: 34, cy: 93, label: 'POR' },
  { id: 'LD',   cx:  9, cy: 75, label: 'LD'  },
  { id: 'DC1',  cx: 25, cy: 75, label: 'DC'  },
  { id: 'DC2',  cx: 43, cy: 75, label: 'DC'  },
  { id: 'LI',   cx: 59, cy: 75, label: 'LI'  },
  { id: 'MCD',  cx:  9, cy: 53, label: 'MCD' },
  { id: 'MC1',  cx: 25, cy: 53, label: 'MC'  },
  { id: 'MC2',  cx: 43, cy: 53, label: 'MC'  },
  { id: 'MCO',  cx: 59, cy: 53, label: 'MCO' },
  { id: 'DEL1', cx: 23, cy: 28, label: 'DEL' },
  { id: 'DEL2', cx: 45, cy: 28, label: 'DEL' },
];

export function Pitch({ state, onOpen }: Props) {
  const count = Object.keys(state.picked).length;

  return (
    <div className="pitch-card">
      <div className="pitch-card-header">
        <div className="pitch-meta">
          <div className="pitch-meta-title">Campo · Formación</div>
          <div className="pitch-meta-sub">{count} de 11 posiciones completadas</div>
        </div>
        <div className="pitch-actions">
          <div className="formation-pill">4 – 4 – 2</div>
        </div>
      </div>
      <div className="pitch-turf">
        <svg className="pitch-svg" viewBox="0 0 68 104" xmlns="http://www.w3.org/2000/svg">
          {/* Field lines */}
          <rect x=".4" y=".4" width="67.2" height="103.2" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <line x1=".4" y1="52" x2="67.6" y2="52" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <circle cx="34" cy="52" r="9" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <circle cx="34" cy="52" r=".7" fill="rgba(255,255,255,.55)" />
          <rect x="14" y=".4" width="40" height="16.2" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <rect x="25" y=".4" width="18" height="5.5" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <path d="M 22 16.6 A 9 9 0 0 1 46 16.6" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <rect x="14" y="87.4" width="40" height="16.2" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <rect x="25" y="98.1" width="18" height="5.5" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <path d="M 22 87.4 A 9 9 0 0 0 46 87.4" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".7" />
          <rect x="27.5" y="-1.8" width="13" height="2.2" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth=".6" />
          <rect x="27.5" y="103.6" width="13" height="2.2" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth=".6" />
          <path d="M .4 .4 A 2 2 0 0 1 2.4 2.4" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".6" />
          <path d="M 67.6 .4 A 2 2 0 0 0 65.6 2.4" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".6" />
          <path d="M .4 103.6 A 2 2 0 0 0 2.4 101.6" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".6" />
          <path d="M 67.6 103.6 A 2 2 0 0 1 65.6 101.6" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".6" />

          {SLOTS.map(s => (
            <Slot key={s.id} {...s} state={state} onOpen={onOpen} />
          ))}
        </svg>
      </div>
    </div>
  );
}
