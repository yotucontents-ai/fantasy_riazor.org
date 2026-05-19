import { useEffect, useRef } from 'react';
import { RiazorIcon } from './RiazorIcon';
import type { Round } from '../types';

interface Props {
  round: Round | null;
  pickedCount: number;
  totalScore: number;
  participantsCount: number;
}

export function Hero({ round, pickedCount, totalScore, participantsCount }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    el.querySelectorAll('.reveal').forEach(r => obs.observe(r));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="hero" id="inicio" ref={ref}>
      <div className="hero-blob blob-1" />
      <div className="hero-blob blob-2" />
      <div className="hero-blob blob-3" />
      <div className="hero-grid" />

      <div className="hero-content">
        <div className="hero-live">
          {round
            ? `Jornada ${round.number} · Liga Hypermotion · ${round.status === 'open' ? 'Activa' : round.status === 'locked' ? 'Cerrada' : 'Completada'}`
            : 'Sin jornada activa'}
        </div>

        <div className="hero-logo reveal">
          <div className="hero-icon-wrap"><RiazorIcon size={44} /></div>
          <div className="hero-site-name">Riazor<span>.org</span></div>
        </div>

        <h1 className="hero-title reveal" style={{ transitionDelay: '.1s' }}>FANTASY</h1>
        <div className="hero-divider reveal" style={{ transitionDelay: '.2s' }} />
        <p className="hero-desc reveal" style={{ transitionDelay: '.25s' }}>
          Selecciona tu once titular del RC Deportivo, elige el MVP del partido y predice el marcador exacto cada jornada. El mejor clasificado al final de temporada gana el premio.
        </p>
        <div className="hero-cta reveal" style={{ transitionDelay: '.3s' }}>
          <a href="#once" className="btn-gold">⚽ Hacer mi alineación</a>
          <a href="#clasificacion" className="btn-ghost">🏆 Ver clasificación</a>
        </div>

        <div className="hero-stats reveal" style={{ transitionDelay: '.4s' }}>
          <div className="hstat">
            <div className="hstat-num"><span>{pickedCount}</span>/11</div>
            <div className="hstat-lbl">Jugadores elegidos</div>
          </div>
          <div className="hstat">
            <div className="hstat-num">{round?.number ?? '—'}</div>
            <div className="hstat-lbl">Jornada actual</div>
          </div>
          <div className="hstat">
            <div className="hstat-num">{participantsCount}</div>
            <div className="hstat-lbl">Participantes</div>
          </div>
          <div className="hstat">
            <div className="hstat-num"><span>{totalScore}</span></div>
            <div className="hstat-lbl">Tu puntuación</div>
          </div>
        </div>
      </div>

      <div className="scroll-hint">Scroll</div>
    </section>
  );
}
