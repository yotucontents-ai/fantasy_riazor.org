import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRounds, createRound, updateRound, calculateRoundPoints } from '../firebase/db';
import { showToast } from '../components/Toast';
import { NavBar } from '../components/NavBar';
import { ALL_PLAYERS } from '../data/players';
import type { Round } from '../types';

function StatusBadge({ status }: { status: Round['status'] }) {
  const cls = status === 'open' ? 'status-open' : status === 'locked' ? 'status-locked' : 'status-completed';
  const label = status === 'open' ? '🟢 Abierta' : status === 'locked' ? '🟡 Cerrada' : '✅ Completada';
  return <span className={`round-status ${cls}`}>{label}</span>;
}

export function AdminPage() {
  const { appUser, loading } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [saving, setSaving] = useState(false);

  // New round form
  const [newForm, setNewForm] = useState({
    number: '', opponent: '', homeGame: true,
    deadline: '', season: '2025/26',
  });

  // Results form
  const [resultsForm, setResultsForm] = useState({
    homeScore: '0', awayScore: '0',
    mvpDorsal: '', lineup: Array(11).fill(''),
  });

  useEffect(() => {
    loadRounds();
  }, []);

  async function loadRounds() {
    setLoadingRounds(true);
    try {
      const r = await getRounds();
      setRounds(r);
    } finally {
      setLoadingRounds(false);
    }
  }

  async function handleCreateRound() {
    if (!newForm.number || !newForm.opponent || !newForm.deadline) {
      showToast('Completa todos los campos', 'warn'); return;
    }
    setSaving(true);
    try {
      await createRound({
        number: Number(newForm.number),
        season: newForm.season,
        opponent: newForm.opponent,
        homeGame: newForm.homeGame,
        deadline: new Date(newForm.deadline),
        status: 'open',
        officialLineup: null,
        officialMVP: null,
        officialScore: null,
      });
      showToast('✅ Jornada creada', 'ok');
      setNewForm({ number: '', opponent: '', homeGame: true, deadline: '', season: '2025/26' });
      loadRounds();
    } catch (e) {
      showToast('❌ Error al crear jornada', 'warn');
    } finally {
      setSaving(false);
    }
  }

  async function handleLockRound(id: string) {
    await updateRound(id, { status: 'locked' });
    showToast('🔒 Jornada cerrada', 'ok');
    loadRounds();
  }

  async function handleSaveResults() {
    if (!selectedRound) return;
    const lineup = resultsForm.lineup.map(Number).filter(Boolean);
    const mvp = Number(resultsForm.mvpDorsal);
    if (lineup.length !== 11 || !mvp) {
      showToast('Introduce 11 jugadores y el MVP', 'warn'); return;
    }
    setSaving(true);
    try {
      await updateRound(selectedRound.id, {
        officialLineup: lineup,
        officialMVP: mvp,
        officialScore: { home: Number(resultsForm.homeScore), away: Number(resultsForm.awayScore) },
        status: 'locked',
      });
      showToast('✅ Resultados guardados', 'ok');
      loadRounds();
    } catch {
      showToast('❌ Error al guardar resultados', 'warn');
    } finally {
      setSaving(false);
    }
  }

  async function handleCalculatePoints(id: string) {
    setSaving(true);
    try {
      await calculateRoundPoints(id);
      showToast('🏆 Puntos calculados correctamente', 'ok');
      loadRounds();
    } catch (e: unknown) {
      showToast(`❌ ${e instanceof Error ? e.message : 'Error'}`, 'warn');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!appUser || appUser.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <>
      <NavBar />
      <div className="admin-page">
        <div className="admin-header">
          <div className="admin-title">⚙ Panel de Administración</div>
          <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
            Fantasy Riazor.org · Temporada 2025/26
          </span>
        </div>

        <div className="admin-grid">
          {/* CREATE ROUND */}
          <div className="admin-card">
            <div className="admin-card-head">🗓 Nueva Jornada</div>
            <div className="admin-card-body">
              {[
                { label: 'Número de jornada', field: 'number', type: 'number', placeholder: 'Ej: 29' },
                { label: 'Rival', field: 'opponent', type: 'text', placeholder: 'Ej: CD Leganés' },
                { label: 'Temporada', field: 'season', type: 'text', placeholder: '2025/26' },
                { label: 'Fecha límite de envío', field: 'deadline', type: 'datetime-local', placeholder: '' },
              ].map(f => (
                <div key={f.field} className="admin-form-row">
                  <label>{f.label}</label>
                  <input
                    className="admin-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={newForm[f.field as keyof typeof newForm] as string}
                    onChange={e => setNewForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="admin-form-row">
                <label>Partido</label>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {['home', 'away'].map(v => (
                    <button
                      key={v}
                      className={`btn-admin${newForm.homeGame === (v === 'home') ? '' : ''}`}
                      style={{ flex: 1, background: newForm.homeGame === (v === 'home') ? 'var(--blue-mid)' : 'rgba(255,255,255,.07)' }}
                      onClick={() => setNewForm(prev => ({ ...prev, homeGame: v === 'home' }))}
                    >
                      {v === 'home' ? '🏠 Casa' : '✈ Fuera'}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn-admin" style={{ width: '100%', marginTop: '.5rem' }} onClick={handleCreateRound} disabled={saving}>
                {saving ? 'Creando…' : '+ Crear jornada'}
              </button>
            </div>
          </div>

          {/* ROUNDS LIST */}
          <div className="admin-card">
            <div className="admin-card-head">📋 Jornadas</div>
            <div className="admin-card-body">
              {loadingRounds ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Cargando…</div>
              ) : rounds.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>No hay jornadas todavía.</div>
              ) : (
                <div className="round-list">
                  {rounds.map(r => (
                    <div key={r.id} className="round-item">
                      <div className="round-item-info">
                        <div className="round-item-name">J{r.number} · {r.opponent}</div>
                        <div className="round-item-sub">{r.season} · {r.deadline.toLocaleDateString('es-ES')}</div>
                      </div>
                      <StatusBadge status={r.status} />
                      <div className="round-item-actions">
                        {r.status === 'open' && (
                          <button className="btn-admin" style={{ padding: '.4rem .7rem', fontSize: '.75rem' }} onClick={() => handleLockRound(r.id)}>
                            🔒
                          </button>
                        )}
                        {(r.status === 'locked' || r.status === 'open') && (
                          <button className="btn-admin" style={{ padding: '.4rem .7rem', fontSize: '.75rem' }} onClick={() => {
                            setSelectedRound(r);
                            if (r.officialLineup) {
                              setResultsForm(prev => ({
                                ...prev,
                                homeScore: String(r.officialScore?.home ?? 0),
                                awayScore: String(r.officialScore?.away ?? 0),
                                mvpDorsal: String(r.officialMVP ?? ''),
                                lineup: r.officialLineup!.map(String),
                              }));
                            }
                          }}>
                            ✏
                          </button>
                        )}
                        {r.status === 'locked' && r.officialLineup && (
                          <button className="btn-admin" style={{ padding: '.4rem .7rem', fontSize: '.75rem', background: 'rgba(0,196,106,.2)', color: 'var(--green)' }} onClick={() => handleCalculatePoints(r.id)} disabled={saving}>
                            🏆
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RESULTS ENTRY */}
          {selectedRound && (
            <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
              <div className="admin-card-head">
                📝 Resultados — J{selectedRound.number} · {selectedRound.opponent}
                <button className="modal-x" style={{ marginLeft: 'auto' }} onClick={() => setSelectedRound(null)}>✕</button>
              </div>
              <div className="admin-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Score */}
                  <div>
                    <div className="admin-form-row">
                      <label>Marcador (RC Deportivo – Rival)</label>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                        <input className="admin-input" type="number" min="0" max="20" style={{ width: 70, textAlign: 'center' }}
                          value={resultsForm.homeScore}
                          onChange={e => setResultsForm(p => ({ ...p, homeScore: e.target.value }))} />
                        <span style={{ color: 'var(--gold)', fontFamily: 'var(--fn-head)', fontSize: '1.5rem' }}>:</span>
                        <input className="admin-input" type="number" min="0" max="20" style={{ width: 70, textAlign: 'center' }}
                          value={resultsForm.awayScore}
                          onChange={e => setResultsForm(p => ({ ...p, awayScore: e.target.value }))} />
                      </div>
                    </div>
                    <div className="admin-form-row">
                      <label>MVP (dorsal)</label>
                      <select className="admin-input" value={resultsForm.mvpDorsal}
                        onChange={e => setResultsForm(p => ({ ...p, mvpDorsal: e.target.value }))}>
                        <option value="">Seleccionar MVP…</option>
                        {ALL_PLAYERS.map(p => (
                          <option key={p.d} value={p.d}>{p.d} · {p.n}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Lineup */}
                  <div>
                    <div className="admin-form-row">
                      <label>Once oficial (11 jugadores)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                        {Array.from({ length: 11 }, (_, i) => (
                          <select key={i} className="admin-input" style={{ fontSize: '.78rem', padding: '.4rem .6rem' }}
                            value={resultsForm.lineup[i]}
                            onChange={e => {
                              const updated = [...resultsForm.lineup];
                              updated[i] = e.target.value;
                              setResultsForm(p => ({ ...p, lineup: updated }));
                            }}>
                            <option value="">Jugador {i + 1}…</option>
                            {ALL_PLAYERS.map(p => (
                              <option key={p.d} value={p.d}>{p.d} · {p.n}</option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '.7rem', marginTop: '1rem' }}>
                  <button className="btn-admin" onClick={handleSaveResults} disabled={saving}>
                    {saving ? 'Guardando…' : '💾 Guardar resultados'}
                  </button>
                  {selectedRound.status === 'locked' && selectedRound.officialLineup && (
                    <button
                      className="btn-admin"
                      style={{ background: 'rgba(0,196,106,.2)', color: 'var(--green)', border: '1px solid rgba(0,196,106,.3)' }}
                      onClick={() => handleCalculatePoints(selectedRound.id)}
                      disabled={saving}
                    >
                      🏆 Calcular puntos
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
