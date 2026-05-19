import { useEffect, useRef, useState } from 'react';
import { getRanking } from '../firebase/db';
import { useAuth } from '../context/AuthContext';
import type { RankingEntry } from '../types';

const AVA_COLORS = [
  ['#003087','#1a7fd4'], ['#1a2a6c','#b21f1f'],
  ['#0f4c75','#1b262c'], ['#2d1b69','#11998e'],
  ['#004e92','#000428'], ['#373b44','#4286f4'],
  ['#0f2027','#203a43'], ['#1a1a2e','#e94560'],
];

export function Ranking() {
  const { appUser } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    getRanking().then(e => { setEntries(e); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    el.querySelectorAll('.reveal').forEach(r => obs.observe(r));
    return () => obs.disconnect();
  }, [loading]);

  const top3 = entries.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const maxPts = entries[0]?.totalPoints ?? 1;

  const posClass = (i: number) => i === 0 ? 'second' : i === 1 ? 'first' : 'third';
  const trophy = (i: number) => i === 0 ? '🥈' : i === 1 ? '🥇' : '🥉';

  const podiumAvaStyle = (i: number) => {
    if (i === 1) return { background: 'linear-gradient(135deg,#8b6914,#f5c518)', borderColor: '#f5c518' };
    if (i === 0) return { background: 'linear-gradient(135deg,#555,#bbb)',        borderColor: '#c0c0c0' };
    return           { background: 'linear-gradient(135deg,#7a4a1a,#cd7f32)',    borderColor: '#cd7f32' };
  };

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <section id="clasificacion" ref={ref}>
      <div className="section-eyebrow reveal">Temporada 2025/26</div>
      <h2 className="section-title reveal" style={{ transitionDelay: '.05s' }}>Clasificación General</h2>
      <p className="section-sub reveal" style={{ transitionDelay: '.1s' }}>
        Ranking acumulado. El líder al final de temporada se lleva el premio.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Cargando…</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          Todavía no hay participantes. ¡Sé el primero!
        </div>
      ) : (
        <>
          {/* PODIUM */}
          {top3.length >= 2 && (
            <div className="podium reveal" style={{ transitionDelay: '.15s' }}>
              {podiumOrder.map((entry, i) => entry && (
                <div key={entry.uid} className={`podium-item ${posClass(i)}`}>
                  <span className="podium-trophy">{trophy(i)}</span>
                  <div className="podium-avatar" style={podiumAvaStyle(i)}>{initials(entry.displayName)}</div>
                  <div className="podium-name">{entry.displayName}</div>
                  <div className="podium-pts">
                    {entry.totalPoints} <span className="pts-lbl">pts</span>
                  </div>
                  <div className="podium-extra">MVP: {entry.mvpHits} ✓ · Resultados: {entry.scoreHits} ✓</div>
                </div>
              ))}
            </div>
          )}

          {/* TABLE */}
          <div className="rank-table-wrap reveal" style={{ transitionDelay: '.2s' }}>
            <table className="rank-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Participante</th>
                  <th>PJ</th>
                  <th>Puntos</th>
                  <th>MVP ✓</th>
                  <th>Result ✓</th>
                  <th className="rbar-wrap">Progreso</th>
                  <th>Últ. jorn.</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((r, idx) => {
                  const pos = idx + 1;
                  const [c1, c2] = AVA_COLORS[idx % AVA_COLORS.length];
                  const posIcon = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
                  const posGold = pos === 1 ? 'g' : pos === 2 ? 's' : pos === 3 ? 'b' : '';
                  const pct = Math.round((r.totalPoints / maxPts) * 100);
                  const lp = r.lastRoundPoints;
                  const lCls = lp !== null ? (lp >= 10 ? 'g' : lp >= 7 ? 'y' : 'r') : 'eq';
                  const isMe = appUser?.uid === r.uid;

                  return (
                    <tr key={r.uid} className={isMe ? 'me' : ''}>
                      <td><div className={`rpos ${posGold}`}>{posIcon}</div></td>
                      <td>
                        <div className="rplayer">
                          <div className="rava" style={{ background: `linear-gradient(135deg,${c1},${c2})`, borderColor: c2 }}>
                            {initials(r.displayName)}
                          </div>
                          <div>
                            <div className="rname">{r.displayName}</div>
                            <div className="rdetail">MVP: {r.mvpHits} ✓ · Res: {r.scoreHits} ✓</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.roundsPlayed}</td>
                      <td><div className="rpts">{r.totalPoints}</div></td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.mvpHits}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.scoreHits}</td>
                      <td className="rbar-wrap">
                        <div className="rbar"><div className="rbar-fill" style={{ width: `${pct}%` }} /></div>
                      </td>
                      <td>
                        <span className={`rlast ${lCls}`}>
                          {lp !== null ? lp : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
