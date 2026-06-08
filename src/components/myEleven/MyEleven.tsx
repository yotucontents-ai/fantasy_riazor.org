import { useEffect, useState } from 'react';
import { Pitch } from './Pitch';
import { PlayerModal } from './PlayerModal';
import { showToast } from '../Toast';
import { CAT_TO_POSITIONS, POSITIONS } from '../../data/players';
import { usePlayers } from '../../context/PlayersContext';
import { Countdown } from '../Countdown';
import { Link } from 'react-router-dom';
import { savePrediction, getPrediction } from '../../firebase/db';
import { useAuth } from '../../context/AuthContext';
import type { LineupState, Player, Position, Round } from '../../types';

interface Props {
  round: Round | null;
  onPickedCountChange: (n: number) => void;
}

type PredStep = 'home' | 'lineup' | 'score' | 'mvp';
type Confirmed = { lineup: boolean; score: boolean; mvp: boolean };

const INITIAL_STATE: LineupState = { picked: {}, mvp: null, score: { home: 0, away: 0 } };

const CAT_TAG: Record<string, string> = {
  porteros: 'POR', defensas: 'DEF', centrocampistas: 'MC', delanteros: 'DEL',
};

export function MyEleven({ round, onPickedCountChange }: Props) {
  const { firebaseUser } = useAuth();
  const { allPlayers } = usePlayers();
  const [state, setState] = useState<LineupState>(INITIAL_STATE);
  const [modalPos, setModalPos] = useState<Position | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<PredStep>('home');
  const [confirmed, setConfirmed] = useState<Confirmed>({ lineup: false, score: false, mvp: false });
  const [mvpQuery, setMvpQuery] = useState('');

  const isLocked = !round || round.status !== 'open' || new Date() > round.deadline;
  const count = Object.keys(state.picked).length;
  const allConfirmed = confirmed.lineup && confirmed.score && confirmed.mvp;

  // Load existing prediction
  useEffect(() => {
    if (!firebaseUser || !round) return;
    getPrediction(firebaseUser.uid, round.id).then(pred => {
      if (!pred) return;
      const picked: Partial<Record<Position, Player>> = {};
      POSITIONS.forEach((pos, i) => {
        const d = pred.lineup[i];
        const pl = allPlayers.find(p => p.d === d);
        if (pl) picked[pos] = pl;
      });
      const mvp = allPlayers.find(p => p.d === pred.mvp) ?? null;
      setState({ picked, mvp, score: pred.score });
      const cp: Confirmed = pred.confirmedParts ?? {
        lineup: pred.lineup.filter(Boolean).length === 11,
        score: false,
        mvp: (pred.mvp ?? 0) > 0,
      };
      setConfirmed(cp);
    });
  }, [firebaseUser, round, allPlayers]);

  useEffect(() => {
    onPickedCountChange(count);
  }, [count, onPickedCountChange]);

  function handleSelect(player: Player) {
    if (modalPos) {
      setState(prev => {
        const newPicked = { ...prev.picked };
        (Object.keys(newPicked) as Position[]).forEach(p => {
          if (newPicked[p]?.d === player.d) delete newPicked[p];
        });
        newPicked[modalPos] = player;
        return { ...prev, picked: newPicked };
      });
      showToast(`✓ ${player.n} → ${modalPos}`, 'ok');
    }
    setModalPos(null);
  }

  pickFromSquadFn = handlePickFromSquad;

  function handlePickFromSquad(player: Player) {
    const positions = CAT_TO_POSITIONS[player.cat];
    const tempPicked = { ...state.picked };
    (Object.keys(tempPicked) as Position[]).forEach(p => {
      if (tempPicked[p]?.d === player.d) delete tempPicked[p];
    });
    const empty = positions.find(p => !tempPicked[p as Position]);
    if (empty) {
      setState(prev => {
        const np = { ...prev.picked };
        (Object.keys(np) as Position[]).forEach(p => { if (np[p]?.d === player.d) delete np[p]; });
        np[empty as Position] = player;
        return { ...prev, picked: np };
      });
      showToast(`✓ ${player.n} → ${empty}`, 'ok');
      setStep('lineup');
    } else {
      showToast(`Ya tienes todos los ${player.cat} asignados`, 'warn');
    }
  }

  function adjScore(field: 'home' | 'away', delta: number) {
    const val = Math.max(0, Math.min(20, state.score[field] + delta));
    setState(prev => ({ ...prev, score: { ...prev.score, [field]: val } }));
  }

  async function doSave(newConfirmed: Confirmed) {
    if (!firebaseUser || !round) return;
    setSaving(true);
    try {
      const lineup = POSITIONS.map(p => state.picked[p]?.d ?? 0);
      await savePrediction({
        userId: firebaseUser.uid,
        roundId: round.id,
        lineup,
        mvp: state.mvp?.d ?? 0,
        score: state.score,
        submittedAt: new Date(),
        confirmedParts: newConfirmed,
      });
      setConfirmed(newConfirmed);
    } catch {
      showToast('❌ Error al guardar, intenta de nuevo', 'warn');
    } finally {
      setSaving(false);
    }
  }

  async function saveLineup() {
    if (count < 11) { showToast(`⚠️ Faltan ${11 - count} jugadores`, 'warn'); return; }
    await doSave({ ...confirmed, lineup: true });
    showToast('✅ Alineación guardada', 'ok');
    setStep('home');
  }

  async function saveScore() {
    await doSave({ ...confirmed, score: true });
    showToast('✅ Resultado guardado', 'ok');
    setStep('home');
  }

  async function saveMvp() {
    if (!state.mvp) { showToast('⚠️ Selecciona el MVP', 'warn'); return; }
    await doSave({ ...confirmed, mvp: true });
    showToast('🎉 ¡Todas tus predicciones guardadas! Buena suerte', 'ok');
    setStep('home');
  }

  // ── Auth gate ──────────────────────────────────────────────────────
  if (!firebaseUser) {
    return (
      <section id="once" style={{ padding: '2rem 1rem' }}>
        <div className="login-gate">
          <div className="login-gate-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div className="login-gate-text">
            <strong>Inicia sesión para participar</strong>
            <p>Necesitas una cuenta para enviar tu alineación, elegir el MVP y predecir el marcador.</p>
          </div>
          <div className="login-gate-btns">
            <Link to="/login" className="btn-gold" style={{ textDecoration: 'none' }}>Iniciar sesión</Link>
            <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none' }} state={{ mode: 'register' }}>Crear cuenta</Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Main render ────────────────────────────────────────────────────
  return (
    <section id="once">
      <div className="once-section-wrap">

        {/* Countdown */}
        {round?.status === 'open' && (
          <div className="deadline-banner">
            ⏱ Tiempo para enviar: <Countdown deadline={round.deadline} />
          </div>
        )}

        {/* Locked notice */}
        {isLocked && (
          <div className="locked-notice">
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

        {/* ── LANDING ── */}
        {step === 'home' && (
          <div className="pred-landing">
            <h2 className="pred-landing-title">Predicciones</h2>

            {allConfirmed && !isLocked && (
              <div className="pred-all-done">
                🎉 ¡Todo guardado! Buena suerte.
              </div>
            )}

            <div className="pred-landing-cards">
              {/* Tu 11 */}
              <button
                className={`pred-lcard${confirmed.lineup ? ' confirmed' : ' pending'}`}
                onClick={() => setStep('lineup')}
              >
                <div className="pred-lcard-badge">{confirmed.lineup ? '✓' : '!'}</div>
                <div className="pred-lcard-icon">⚽</div>
                <div className="pred-lcard-name">Tu 11</div>
              </button>

              {/* MVP */}
              <button
                className={`pred-lcard${confirmed.mvp ? ' confirmed' : ' pending'}${isLocked ? ' locked' : ''}`}
                onClick={() => !isLocked && setStep('mvp')}
              >
                <div className="pred-lcard-badge">{confirmed.mvp ? '✓' : '!'}</div>
                <div className="pred-lcard-icon">⭐</div>
                <div className="pred-lcard-name">MVP</div>
              </button>

              {/* Resultado */}
              <button
                className={`pred-lcard${confirmed.score ? ' confirmed' : ' pending'}${isLocked ? ' locked' : ''}`}
                onClick={() => !isLocked && setStep('score')}
              >
                <div className="pred-lcard-badge">{confirmed.score ? '✓' : '!'}</div>
                <div className="pred-lcard-icon">
                  <span className="lcard-score-wrap">
                    <span className="lcard-score-box">{state.score.home}</span>
                    <span className="lcard-score-vs">vs</span>
                    <span className="lcard-score-box">{state.score.away}</span>
                  </span>
                </div>
                <div className="pred-lcard-name">1 × 2</div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: ALINEACIÓN ── */}
        {step === 'lineup' && (
          <div className="step-pane">
            <div className="step-lineup-hdr">
              <button className="btn-back-sm" onClick={() => setStep('home')}>← Volver</button>
              {!isLocked && <span className="step-count-sm">{count}/11 seleccionados</span>}
            </div>
            <Pitch state={state} onOpen={pos => !isLocked && setModalPos(pos)} />
            {!isLocked && (
              <button
                className="btn-confirm"
                onClick={saveLineup}
                disabled={saving || count < 11}
              >
                {saving ? 'Guardando…' : confirmed.lineup ? '✓ Guardada · Actualizar' : 'Guardar alineación →'}
              </button>
            )}
          </div>
        )}

        {/* ── STEP: RESULTADO ── */}
        {step === 'score' && !isLocked && (
          <div className="step-pane">
            <button className="btn-back-sm" onClick={() => setStep('home')}>← Volver</button>
            <h3 className="step-title">¿Cuál será el resultado?</h3>

            <div className="score-big-wrap">
              <div className="score-big-col">
                <div className="score-team-name">{round?.homeGame ? 'Deportivo' : (round?.opponent ?? 'Local')}</div>
                <div className="score-big-controls">
                  <button className="score-big-btn" onClick={() => adjScore('home', +1)}>+</button>
                  <div className="score-big-num">{state.score.home}</div>
                  <button className="score-big-btn" onClick={() => adjScore('home', -1)}>−</button>
                </div>
              </div>
              <div className="score-big-colon">:</div>
              <div className="score-big-col">
                <div className="score-team-name">{round?.homeGame ? (round?.opponent ?? 'Rival') : 'Deportivo'}</div>
                <div className="score-big-controls">
                  <button className="score-big-btn" onClick={() => adjScore('away', +1)}>+</button>
                  <div className="score-big-num">{state.score.away}</div>
                  <button className="score-big-btn" onClick={() => adjScore('away', -1)}>−</button>
                </div>
              </div>
            </div>

            <div className="step-footer">
              <button className="btn-confirm" onClick={saveScore} disabled={saving}>
                {saving ? 'Guardando…' : confirmed.score ? '✓ Guardado · Actualizar' : 'Guardar resultado →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: MVP ── */}
        {step === 'mvp' && !isLocked && (
          <div className="step-pane">
            <button className="btn-back-sm" onClick={() => setStep('home')}>← Volver</button>
            <h3 className="step-title">¿Quién será el MVP?</h3>

            <input
              className="modal-search"
              type="text"
              placeholder="Buscar por nombre o dorsal…"
              value={mvpQuery}
              onChange={e => setMvpQuery(e.target.value.toLowerCase())}
              style={{ margin: '0 0 .75rem' }}
            />

            <div className="mvp-step-list">
              {allPlayers
                .filter(p => p.n.toLowerCase().includes(mvpQuery) || String(p.d).includes(mvpQuery))
                .map(p => {
                  const sel = state.mvp?.d === p.d;
                  return (
                    <div
                      key={p.d}
                      className={`mrow${sel ? ' sel' : ''}`}
                      onClick={() => setState(prev => ({ ...prev, mvp: p }))}
                    >
                      <div className="mrow-num">{p.d}</div>
                      <div className="mrow-info">
                        <div className="mrow-name">{p.n}</div>
                        <div className="mrow-tag">{CAT_TAG[p.cat]}</div>
                      </div>
                      {sel && <div className="mrow-check">✓</div>}
                    </div>
                  );
                })}
            </div>

            <div className="step-footer">
              <button className="btn-confirm" onClick={saveMvp} disabled={saving || !state.mvp}>
                {saving ? 'Guardando…' : confirmed.mvp ? '✓ Guardado · Actualizar' : 'Guardar MVP →'}
              </button>
            </div>
          </div>
        )}

      </div>

      <PlayerModal
        pos={modalPos}
        state={state}
        onSelect={handleSelect}
        onClose={() => setModalPos(null)}
      />
    </section>
  );
}

// Module-level ref so Squad.tsx can call pick without prop drilling
export let pickFromSquadFn: ((player: Player) => void) | null = null;
