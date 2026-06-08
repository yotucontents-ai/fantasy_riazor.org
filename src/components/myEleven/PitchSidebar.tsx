import type { LineupState } from '../../types';
import { POSITIONS } from '../../data/players';

interface Props {
  state: LineupState;
  onMvpClick: () => void;
  onScoreChange: (home: number, away: number) => void;
}

export function PitchSidebar({ state, onMvpClick, onScoreChange }: Props) {
  const count = Object.keys(state.picked).length;
  const pct = (count / 11) * 100;

  function adj(field: 'home' | 'away', delta: number) {
    const val = Math.max(0, Math.min(20, state.score[field] + delta));
    onScoreChange(
      field === 'home' ? val : state.score.home,
      field === 'away' ? val : state.score.away,
    );
  }

  const mvpInitials = state.mvp
    ? state.mvp.n.split(' ').map(w => w[0]).slice(0, 2).join('')
    : null;

  return (
    <div className="once-sidebar">
      {/* MVP — primera fila, columna izquierda */}
      <div className="side-card">
        <div className="side-header">
          <div className="side-icon si-gold">🌟</div>
          MVP del Partido
        </div>
        <div className="mvp-body">
          <div className={`mvp-trigger${state.mvp ? ' picked' : ''}`} onClick={onMvpClick}>
            <div className="mvp-ava">{mvpInitials ?? '👤'}</div>
            <div className="mvp-info">
              <div className="mvp-lbl">Mejor jugador</div>
              <div className={`mvp-val${state.mvp ? ' picked' : ''}`}>
                {state.mvp ? `${state.mvp.d} · ${state.mvp.n}` : 'Seleccionar →'}
              </div>
            </div>
            <div className="mvp-arrow">›</div>
          </div>
        </div>
      </div>

      {/* RESULTADO — primera fila, columna derecha */}
      <div className="side-card">
        <div className="side-header">
          <div className="side-icon si-green">🎯</div>
          Resultado Exacto
        </div>
        <div className="resultado-body">
          <div className="match-row">
            <span className="team-lbl">RC Deportivo</span>
            <span className="vs-chip">VS</span>
            <span className="team-lbl">Rival</span>
          </div>
          <div className="score-wrap">
            {(['home', 'away'] as const).map((field, i) => (
              <>
                {i === 1 && <div className="score-colon">:</div>}
                <div key={field} className="score-box-wrap">
                  <input
                    className="score-box"
                    type="number"
                    min="0"
                    max="20"
                    value={state.score[field]}
                    onChange={e => {
                      const v = Math.max(0, Math.min(20, Number(e.target.value)));
                      onScoreChange(
                        field === 'home' ? v : state.score.home,
                        field === 'away' ? v : state.score.away,
                      );
                    }}
                  />
                  <div className="score-stepper">
                    <button className="step-btn" onClick={() => adj(field, -1)}>−</button>
                    <button className="step-btn" onClick={() => adj(field, +1)}>+</button>
                  </div>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* MI ONCE LIST — segunda fila, columna izquierda */}
      <div className="side-card">
        <div className="side-header">
          <div className="side-icon si-blue">📋</div>
          Mi Once
        </div>
        <div className="my11-list">
          {POSITIONS.map(p => {
            const pl = state.picked[p];
            return (
              <div key={p} className="my11-row">
                <div className="my11-pos">{p}</div>
                <div className="my11-sep" />
                <div className={`my11-name${pl ? ' picked' : ''}`}>{pl ? pl.n : 'vacío'}</div>
                {pl && <div className="my11-dorsal show">{pl.d}</div>}
              </div>
            );
          })}
        </div>
        <div className="progress-wrap">
          <div className="progress-row">
            <span className="progress-lbl">Completado</span>
            <span className="progress-val">{count}/11</span>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* PUNTOS — segunda fila, columna derecha */}
      <div className="side-card">
        <div className="side-header">
          <div className="side-icon si-gold">📊</div>
          Puntuación
        </div>
        <div className="puntos-body">
          {[
            { ico: '✅', lbl: 'Once exacto (11/11)', pts: '+5 pts' },
            { ico: '🌟', lbl: 'MVP correcto', pts: '+3 pts' },
            { ico: '🎯', lbl: 'Resultado exacto', pts: '+5 pts' },
            { ico: '⚽', lbl: 'Ganador correcto', pts: '+2 pts' },
          ].map(p => (
            <div key={p.lbl} className="pto">
              <span className="pto-ico">{p.ico}</span>
              <span className="pto-lbl">{p.lbl}</span>
              <span className="pto-pts">{p.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
