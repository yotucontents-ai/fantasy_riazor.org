import { RiazorIcon } from './RiazorIcon';

export function Footer() {
  return (
    <footer>
      <div className="foot-brand">
        <div className="foot-icon"><RiazorIcon size={26} /></div>
        <div>
          <div className="foot-name">Riazor<span>.org</span></div>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fantasy · Liga Interna</div>
        </div>
      </div>
      <p className="foot-text">
        Selecciona tu once cada jornada, elige el MVP, predice el marcador y compite por ser el mejor del grupo. ¡Aúpa o Dépor!
      </p>
      <div className="foot-copy">© 2025/26 Fantasy Riazor.org · RC Deportivo de La Coruña</div>
    </footer>
  );
}
