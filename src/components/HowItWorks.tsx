import { useEffect, useRef } from 'react';

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);

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
    <section id="como" ref={ref}>
      <div className="section-eyebrow reveal">El juego</div>
      <h2 className="section-title reveal" style={{ transitionDelay: '.05s' }}>¿Cómo funciona?</h2>
      <p className="section-sub reveal" style={{ transitionDelay: '.1s' }}>
        Cuatro acciones, una clasificación, un premio. Demuestra que conoces mejor que nadie al Dépor.
      </p>

      <div className="rules-grid">
        {[
          { n: '01', icon: '🏟️', title: 'Cada jornada', desc: 'Antes del partido del fin de semana, selecciona los 11 jugadores titulares del RC Deportivo de La Coruña que crees que van a jugar.' },
          { n: '02', icon: '🌟', title: 'Elige el MVP', desc: 'Escoge al jugador que crees que tendrá el mejor rendimiento en el partido. Suma puntos extra si aciertas quién se lleva el protagonismo.' },
          { n: '03', icon: '🎯', title: 'Predice el marcador', desc: 'Indica el resultado exacto. Si lo clavas, consigues la máxima puntuación. Si aciertas el ganador o el empate, también sumas.' },
          { n: '04', icon: '🏆', title: 'Clasificación anual', desc: 'Se acumula una puntuación jornada a jornada. El participante que quede primero al cierre de la temporada se lleva el premio.' },
        ].map((r, i) => (
          <div key={r.n} className="rule-card reveal" style={{ transitionDelay: `${0.05 + i * 0.05}s` }}>
            <div className="rule-num">{r.n}</div>
            <span className="rule-icon">{r.icon}</span>
            <div className="rule-title">{r.title}</div>
            <p className="rule-desc">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="pts-table-wrap reveal">
        <div className="pts-table-head">📊 Sistema de puntuación</div>
        <div className="puntos-body">
          {[
            { ico: '✅', lbl: 'Once titular exacto (11/11)', pts: '+5 pts' },
            { ico: '🌟', lbl: 'MVP correcto', pts: '+3 pts' },
            { ico: '🎯', lbl: 'Resultado exacto', pts: '+5 pts' },
            { ico: '⚽', lbl: 'Ganador correcto', pts: '+2 pts' },
            { ico: '🤝', lbl: 'Empate correcto', pts: '+2 pts' },
          ].map(p => (
            <div key={p.lbl} className="pto">
              <span className="pto-ico">{p.ico}</span>
              <span className="pto-lbl">{p.lbl}</span>
              <span className="pto-pts">{p.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
