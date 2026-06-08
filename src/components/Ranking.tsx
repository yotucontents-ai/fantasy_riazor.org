import { useEffect, useRef, useState } from 'react';
import { getRanking } from '../firebase/db';
import { useAuth } from '../context/AuthContext';
import type { RankingEntry, Round } from '../types';

const PAGE_SIZE = 10;

interface Props {
  round: Round | null;
  onViewPrediction: (uid: string, name: string) => void;
  onParticipantsCount?: (n: number) => void;
}

export function Ranking({ round, onViewPrediction, onParticipantsCount }: Props) {
  const { appUser, firebaseUser, loading: authLoading } = useAuth();
  const now = new Date();
  const canView = round !== null && (round.status !== 'open' || now > round.deadline);
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const ref = useRef<HTMLElement>(null);

  function doFetch() {
    setLoading(true);
    setFetchError(null);
    getRanking()
      .then(e => {
        setEntries(e);
        setLoading(false);
        onParticipantsCount?.(e.length);
        // Saltar a la página del usuario logueado
        if (appUser) {
          const myIdx = e.findIndex(r => r.uid === appUser.uid);
          if (myIdx >= 0) setPage(Math.floor(myIdx / PAGE_SIZE));
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Ranking] getRanking error:', err);
        setFetchError(msg);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (authLoading) return;
    doFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, authLoading]);

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
  const maxPts = Math.max(entries[0]?.totalPoints ?? 1, 1);

  const trophy = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
  const podiumBorder = (i: number) => i === 0 ? '#f5c518' : i === 1 ? '#c0c0c0' : '#cd7f32';

  const q = search.toLowerCase().trim();
  const filtered = q
    ? entries.filter(e => e.displayName.toLowerCase().includes(q))
    : entries;
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(0);
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
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#e94560' }}>
          <div style={{ marginBottom: '.5rem', fontWeight: 600 }}>Error al cargar el ranking</div>
          <code style={{ fontSize: '.75rem', background: 'rgba(255,255,255,.06)', padding: '.25rem .5rem', borderRadius: '4px', display: 'block', marginBottom: '1rem', wordBreak: 'break-all' }}>
            {fetchError}
          </code>
          {!firebaseUser && (
            <div style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '.9rem' }}>
              Necesitas iniciar sesión para ver el ranking.
            </div>
          )}
          <button className="btn-ghost" onClick={doFetch} style={{ fontSize: '.85rem' }}>Reintentar</button>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Todavía no hay participantes. ¡Sé el primero!
          </div>
          {firebaseUser && (
            <button className="btn-ghost" onClick={doFetch} style={{ fontSize: '.85rem' }}>Reintentar</button>
          )}
        </div>
      ) : (
        <>
          {/* PODIUM */}
          {top3.length >= 2 && (
            <div className="podium reveal" style={{ transitionDelay: '.15s' }}>
              {top3.map((entry, i) => entry && (
                <div key={entry.uid} className="podium-item" style={{ borderColor: podiumBorder(i) }}>
                  <span className="podium-trophy">{trophy(i)}</span>
                  <div className="podium-name">{entry.displayName}</div>
                  <div className="podium-pts">
                    {entry.totalPoints} <span className="pts-lbl">pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BUSCADOR */}
          <div className="rank-search-wrap reveal" style={{ transitionDelay: '.18s' }}>
            <input
              className="rank-search"
              type="text"
              placeholder="Buscar participante…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button className="rank-search-clear" onClick={() => handleSearch('')}>✕</button>
            )}
          </div>

          {/* TABLE */}
          <div className="rank-table-wrap reveal" style={{ transitionDelay: '.2s' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                Sin resultados para «{search}»
              </div>
            ) : (
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
                  {pageEntries.map(r => {
                    const globalIdx = filtered.indexOf(r);
                    const pos = globalIdx + 1;
                    const posIcon = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
                    const posGold = pos === 1 ? 'g' : pos === 2 ? 's' : pos === 3 ? 'b' : '';
                    const pct = Math.round((r.totalPoints / maxPts) * 100);
                    const lp = r.lastRoundPoints;
                    const lCls = lp !== null ? (lp >= 10 ? 'g' : lp >= 7 ? 'y' : 'r') : 'eq';
                    const isMe = appUser?.uid === r.uid;

                    return (
                      <tr
                        key={r.uid}
                        className={`${isMe ? 'me' : ''}${canView ? ' rank-clickable' : ''}`}
                        onClick={() => canView && onViewPrediction(r.uid, r.displayName)}
                        title={canView ? `Ver predicción de ${r.displayName}` : undefined}
                      >
                        <td><div className={`rpos ${posGold}`}>{posIcon}</div></td>
                        <td>
                          <div className="rplayer">
                            <div className="rname">{r.displayName}</div>
                            <div className="rdetail">MVP: {r.mvpHits} ✓ · Res: {r.scoreHits} ✓</div>
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
                          <span className={`rlast ${lCls}`}>{lp !== null ? lp : '—'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINACIÓN */}
          {pageCount > 1 && (
            <div className="rank-pagination">
              <button
                className="rank-page-btn"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                ← Anteriores
              </button>
              <span className="rank-page-info">
                {page + 1} / {pageCount}
              </span>
              <button
                className="rank-page-btn"
                disabled={page >= pageCount - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Siguientes →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
