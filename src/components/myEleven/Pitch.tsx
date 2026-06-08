import { useRef, useState } from 'react';
import type { LineupState, Position } from '../../types';

// Simple shirt path centred at (0,0): ~13w × 11h SVG units
const SHIRT =
  'M 0,-5.5 C -1,-5.5 -2,-5.2 -2.5,-4.5 L -5,-3.5 L -6.5,-2.5 L -6,-1 L -5,-1 L -4.5,5.5 L 4.5,5.5 L 5,-1 L 6,-1 L 6.5,-2.5 L 5,-3.5 C 2,-5.2 1,-5.5 0,-5.5 Z';

type SlotPos = { cx: number; cy: number };

interface SlotProps {
  id: Position;
  cx: number;
  cy: number;
  label: string;
  isGK: boolean;
  state: LineupState;
  onOpen: (pos: Position) => void;
  onMove: (id: Position, cx: number, cy: number) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

function Slot({ id, cx, cy, label, isGK, state, onOpen, onMove, svgRef }: SlotProps) {
  const player = state.picked[id];
  const filled = !!player;
  const lastName = player ? (player.n.split(' ').pop() ?? player.n).slice(0, 9) : '';

  const movedRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0 });

  function toSVG(e: React.PointerEvent): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: cx, y: cy };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const inv = svg.getScreenCTM()?.inverse();
    if (!inv) return { x: cx, y: cy };
    const r = pt.matrixTransform(inv);
    return { x: r.x, y: r.y };
  }

  function handlePointerDown(e: React.PointerEvent<SVGGElement>) {
    e.stopPropagation();
    e.preventDefault(); // prevent synthetic click/mousedown after pointerup on mobile
    e.currentTarget.setPointerCapture(e.pointerId);
    movedRef.current = false;
    const p = toSVG(e);
    originRef.current = { x: p.x - cx, y: p.y - cy };
  }

  function handlePointerMove(e: React.PointerEvent<SVGGElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const p = toSVG(e);
    const nx = Math.max(7, Math.min(61, p.x - originRef.current.x));
    const ny = Math.max(6, Math.min(98, p.y - originRef.current.y));
    if (Math.hypot(nx - cx, ny - cy) > 5) movedRef.current = true;
    if (movedRef.current) onMove(id, nx, ny);
  }

  function handlePointerUp(e: React.PointerEvent<SVGGElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!movedRef.current) onOpen(id);
  }

  const shirtFill   = filled ? (isGK ? '#1e8c44' : '#003da5') : (isGK ? 'rgba(30,140,68,.28)' : 'rgba(0,61,165,.28)');
  const shirtStroke = filled ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.3)';
  const labelColor  = filled ? '#fff' : 'rgba(255,255,255,.45)';

  return (
    <g
      transform={`translate(${cx},${cy})`}
      style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* drop shadow */}
      <path d={SHIRT} fill="rgba(0,0,0,.28)" transform="translate(.6,1.4) scale(1.04,1.04)" />
      {/* shirt body */}
      <path d={SHIRT} fill={shirtFill} stroke={shirtStroke} strokeWidth=".65" strokeLinejoin="round" />
      {/* position number */}
      <text
        x="0" y="1.2"
        textAnchor="middle" dominantBaseline="middle"
        fontSize="4.4" fontWeight="900"
        fontFamily="'Barlow Condensed', sans-serif"
        fill={labelColor}
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>
      {/* player last name below shirt */}
      <text
        x="0" y="9"
        textAnchor="middle" dominantBaseline="middle"
        fontSize="2.7" fontWeight="700"
        fontFamily="'Barlow Condensed', sans-serif"
        fill={filled ? 'rgba(255,255,255,.92)' : 'transparent'}
        style={{ pointerEvents: 'none' }}
      >
        {lastName}
      </text>
    </g>
  );
}

const SLOTS: { id: Position; cx: number; cy: number; label: string; isGK: boolean }[] = [
  { id: 'POR',  cx: 34, cy: 92, label: '1',  isGK: true  },
  { id: 'LD',   cx:  9, cy: 74, label: '2',  isGK: false },
  { id: 'DC1',  cx: 25, cy: 74, label: '3',  isGK: false },
  { id: 'DC2',  cx: 43, cy: 74, label: '4',  isGK: false },
  { id: 'LI',   cx: 59, cy: 74, label: '5',  isGK: false },
  { id: 'MCD',  cx:  9, cy: 53, label: '6',  isGK: false },
  { id: 'MC1',  cx: 25, cy: 53, label: '7',  isGK: false },
  { id: 'MC2',  cx: 43, cy: 53, label: '8',  isGK: false },
  { id: 'MCO',  cx: 59, cy: 53, label: '9',  isGK: false },
  { id: 'DEL1', cx: 23, cy: 28, label: '10', isGK: false },
  { id: 'DEL2', cx: 45, cy: 28, label: '11', isGK: false },
];

interface Props {
  state: LineupState;
  onOpen: (pos: Position) => void;
}

function initPositions(): Record<Position, SlotPos> {
  const r = {} as Record<Position, SlotPos>;
  SLOTS.forEach(s => { r[s.id] = { cx: s.cx, cy: s.cy }; });
  return r;
}

export function Pitch({ state, onOpen }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Record<Position, SlotPos>>(initPositions);

  function handleMove(id: Position, cx: number, cy: number) {
    setPositions(prev => ({ ...prev, [id]: { cx, cy } }));
  }

  return (
    <div className="pitch-card">
      <div className="pitch-turf">
        <svg
          ref={svgRef}
          className="pitch-svg"
          viewBox="0 0 68 104"
          xmlns="http://www.w3.org/2000/svg"
          style={{ touchAction: 'none', display: 'block' }}
        >
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
            <Slot
              key={s.id}
              {...s}
              cx={positions[s.id].cx}
              cy={positions[s.id].cy}
              state={state}
              onOpen={onOpen}
              onMove={handleMove}
              svgRef={svgRef}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
