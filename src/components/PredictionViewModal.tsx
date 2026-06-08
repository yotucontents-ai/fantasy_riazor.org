import { useEffect, useState } from 'react';
import { getPrediction, getRounds } from '../firebase/db';
import { usePlayers } from '../context/PlayersContext';
import { POSITIONS } from '../data/players';
import type { Prediction, Round } from '../types';

interface Props {
  uid: string | null;
  userName: string;
  currentRound: Round | null;
  onClose: () => void;
}

export function PredictionViewModal({ uid, userName, currentRound, onClose }: Props) {
  const { allPlayers } = usePlayers();
  const [closedRounds, setClosedRounds] = useState<Round[]>([]);
  const [roundId, setRoundId] = useState('');
  const [pred, setPred] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const open = uid !== null;

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    getRounds().then(all => {
      const closed = all.filter(r => r.status !== 'open' || now > r.deadline);
      setClosedRounds(closed);
      const currentIsLocked = currentRound && (currentRound.status !== 'open' || now > currentRound.deadline);
      const def = currentIsLocked ? currentRound : closed[0];
      if (def) setRoundId(def.id);
    });
  }, [open, uid]);

  useEffect(() => {
    if (!uid || !roundId) { setPred(null); return; }
    setLoading(true);
    getPrediction(uid, roundId)
      .then(p => { setPred(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, [uid, roundId]);

  if (!open) return null;

  const selectedRound = closedRounds.find(r => r.id === roundId);
  const homeTeam = selectedRound?.homeGame ? 'Deportivo' : (selectedRound?.opponent ?? 'Local');
  const awayTeam = selectedRound?.homeGame ? (selectedRound?.opponent ?? 'Rival') : 'Deportivo';

  return (
    <div className="modal-bg open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel">
        <span className="modal-drag" />
        <div className="modal-head">
          <div className="modal-title">
            <span className="predview-sub">Predicción de</span>
            <span className="predview-name">{userName}</span>
          </div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Round selector */}
        {closedRounds.length > 1 && (
          <div className="predview-round-sel">
            <select
              className="admin-input"
              value={roundId}
              onChange={e => setRoundId(e.target.value)}
            >
              {closedRounds.map(r => (
                <option key={r.id} value={r.id}>
                  J{r.number} · {r.homeGame ? 'Deportivo' : r.opponent} vs {r.homeGame ? r.opponent : 'Deportivo'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="modal-list predview-body">
          {loading ? (
            <div className="predview-empty">Cargando…</div>
          ) : !pred ? (
            <div className="predview-empty">Sin predicción para esta jornada.</div>
          ) : (
            <>
              {/* Score */}
              <div className="predview-section">
                <div className="predview-label">Resultado predicho</div>
                <div className="predview-score">
                  <span className="predview-score-team">{homeTeam}</span>
                  <span className="predview-score-val">{pred.score.home} : {pred.score.away}</span>
                  <span className="predview-score-team">{awayTeam}</span>
                </div>
              </div>

              {/* MVP */}
              <div className="predview-section">
                <div className="predview-label">MVP elegido</div>
                <div className="predview-mvp">
                  {pred.mvp
                    ? (allPlayers.find(p => p.d === pred.mvp)?.n ?? `Dorsal ${pred.mvp}`)
                    : '—'}
                </div>
              </div>

              {/* Lineup */}
              <div className="predview-section">
                <div className="predview-label">Alineación</div>
                <div className="predview-lineup">
                  {POSITIONS.map((pos, i) => {
                    const dorsal = pred.lineup[i];
                    const player = dorsal ? allPlayers.find(p => p.d === dorsal) : null;
                    return (
                      <div key={pos} className="predview-slot">
                        <div className="predview-slot-num">{i + 1}</div>
                        <div className={`predview-slot-name${player ? ' filled' : ''}`}>
                          {player ? player.n : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
