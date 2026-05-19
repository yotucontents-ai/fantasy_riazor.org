import { useEffect, useRef, useState } from 'react';
import { Pitch } from './Pitch';
import { PitchSidebar } from './PitchSidebar';
import { PlayerModal } from './PlayerModal';
import { showToast } from '../Toast';
import { ALL_PLAYERS, CAT_TO_POSITIONS, POSITIONS } from '../../data/players';
import { savePrediction, getPrediction } from '../../firebase/db';
import { useAuth } from '../../context/AuthContext';
import type { LineupState, Player, Position, Round } from '../../types';

interface Props {
  round: Round | null;
  onPickedCountChange: (n: number) => void;
}

const INITIAL_STATE: LineupState = {
  picked: {},
  mvp: null,
  score: { home: 0, away: 0 },
};

export function MyEleven({ round, onPickedCountChange }: Props) {
  const { firebaseUser } = useAuth();
  const [state, setState] = useState<LineupState>(INITIAL_STATE);
  const [modalPos, setModalPos] = useState<Position | '__mvp__' | null>(null);
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const isLocked = !round || round.status !== 'open';

  // Load existing prediction
  useEffect(() => {
    if (!firebaseUser || !round) return;
    getPrediction(firebaseUser.uid, round.id).then(pred => {
      if (!pred) return;
      const picked: Partial<Record<Position, Player>> = {};
      POSITIONS.forEach((pos, i) => {
        const d = pred.lineup[i];
        const pl = ALL_PLAYERS.find(p => p.d === d);
        if (pl) picked[pos] = pl;
      });
      const mvp = ALL_PLAYERS.find(p => p.d === pred.mvp) ?? null;
      setState({ picked, mvp, score: pred.score });
      setAlreadySaved(true);
    });
  }, [firebaseUser, round]);

  // Notify parent of count changes
  useEffect(() => {
    onPickedCountChange(Object.keys(state.picked).length);
  }, [state.picked, onPickedCountChange]);

  // Reveal animations
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    el.querySelectorAll('.reveal').forEach(r => obs.observe(r));
    return () => obs.disconnect();
  }, []);

  function assignPlayer(pos: Position, player: Player) {
    setState(prev => ({
      ...prev,
      picked: { ...prev.picked, [pos]: player },
    }));
  }

  function handleSelect(player: Player) {
    if (modalPos === '__mvp__') {
      setState(prev => ({ ...prev, mvp: player }));
      showToast(`⭐ MVP: ${player.n}`, 'ok');
    } else if (modalPos) {
      assignPlayer(modalPos, player);
      showToast(`✓ ${player.n} → ${modalPos}`, 'ok');
    }
    setModalPos(null);
  }

  // Register so Squad.tsx can call without prop drilling
  pickFromSquadFn = handlePickFromSquad;

  function handlePickFromSquad(player: Player) {
    const positions = CAT_TO_POSITIONS[player.cat];
    const empty = positions.find(p => !state.picked[p as Position]);
    if (empty) {
      assignPlayer(empty as Position, player);
      showToast(`✓ ${player.n} → ${empty}`, 'ok');
    } else {
      showToast(`Ya tienes todos los ${player.cat} asignados`, 'warn');
    }
  }

  function resetAll() {
    setState(INITIAL_STATE);
    setAlreadySaved(false);
    showToast('↺ Alineación limpiada', 'ok');
  }

  async function confirmLineup() {
    const count = Object.keys(state.picked).length;
    if (count < 11) { showToast(`⚠️ Faltan ${11 - count} jugadores`, 'warn'); return; }
    if (!state.mvp) { showToast('⚠️ Selecciona el MVP', 'warn'); return; }
    if (!firebaseUser) { showToast('⚠️ Inicia sesión para guardar', 'warn'); return; }
    if (!round) { showToast('⚠️ No hay jornada activa', 'warn'); return; }

    setSaving(true);
    try {
      const lineup = POSITIONS.map(p => state.picked[p]?.d ?? 0);
      await savePrediction({
        userId: firebaseUser.uid,
        roundId: round.id,
        lineup,
        mvp: state.mvp.d,
        score: state.score,
        submittedAt: new Date(),
      });
      setAlreadySaved(true);
      showToast('🎉 ¡Alineación confirmada! Buena suerte', 'ok');
    } catch {
      showToast('❌ Error al guardar, intenta de nuevo', 'warn');
    } finally {
      setSaving(false);
    }
  }

  const count = Object.keys(state.picked).length;

  return (
    <section id="once" ref={ref}>
      <div className="section-eyebrow reveal">Jornada {round?.number ?? '—'}</div>
      <h2 className="section-title reveal" style={{ transitionDelay: '.05s' }}>Selecciona Tu Once</h2>
      <p className="section-sub reveal" style={{ transitionDelay: '.1s' }}>
        Toca cada posición en el campo para asignar jugador. Formación 4–4–2.
      </p>

      {isLocked && (
        <div className="locked-notice reveal">
          <span className="locked-notice-icon">🔒</span>
          <div className="locked-notice-text">
            {!round
              ? <><strong>Sin jornada activa.</strong> El administrador debe crear una jornada.</>
              : round.status === 'locked'
              ? <><strong>Jornada cerrada.</strong> El plazo de envío ha terminado.</>
              : <><strong>Jornada completada.</strong> Ya se han calculado los puntos.</>
            }
          </div>
        </div>
      )}

      <div className="once-layout" style={{ pointerEvents: isLocked ? 'none' : undefined, opacity: isLocked ? 0.6 : 1 }}>
        <div className="reveal">
          <Pitch state={state} onOpen={pos => !isLocked && setModalPos(pos)} />
        </div>
        <div className="reveal" style={{ transitionDelay: '.15s' }}>
          <PitchSidebar
            state={state}
            onMvpClick={() => !isLocked && setModalPos('__mvp__')}
            onScoreChange={(home, away) => setState(prev => ({ ...prev, score: { home, away } }))}
          />
        </div>
      </div>

      {!isLocked && (
        <div className="submit-bar reveal" style={{ transitionDelay: '.2s' }}>
          <div className="submit-info">
            Jugadores: <strong>{count}/11</strong> &nbsp;·&nbsp;
            MVP: <strong>{state.mvp ? state.mvp.n : 'Pendiente'}</strong> &nbsp;·&nbsp;
            Resultado: <strong>{state.score.home} – {state.score.away}</strong>
            {alreadySaved && <span style={{ color: 'var(--green)', marginLeft: '1rem' }}>✓ Guardado</span>}
          </div>
          <div className="submit-btns">
            <button className="btn-reset" onClick={resetAll}>↺ Limpiar</button>
            <button className="btn-confirm" onClick={confirmLineup} disabled={saving}>
              {saving ? 'Guardando…' : alreadySaved ? 'Actualizar →' : 'Confirmar alineación →'}
            </button>
          </div>
        </div>
      )}

      <PlayerModal
        pos={modalPos}
        state={state}
        onSelect={handleSelect}
        onClose={() => setModalPos(null)}
      />

    </section>
  );
}

// Module-level ref so Squad can call pick without prop drilling
export let pickFromSquadFn: ((player: Player) => void) | null = null;
