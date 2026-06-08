import { Link } from 'react-router-dom';

export type Tab = 'inicio' | 'once' | 'plantilla' | 'ranking';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'inicio',    icon: '🏠', label: 'Inicio'    },
  { key: 'once',      icon: '⚽', label: 'Mi Elección' },
  { key: 'plantilla', icon: '👥', label: 'Plantilla' },
  { key: 'ranking',   icon: '🏆', label: 'Ranking'   },
];

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
  isAdmin: boolean;
}

export function BottomNav({ active, onChange, isAdmin }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button
          key={t.key}
          className={`bnav-btn${active === t.key ? ' active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <span className="bnav-icon">{t.icon}</span>
          <span className="bnav-label">{t.label}</span>
        </button>
      ))}
      {isAdmin && (
        <Link to="/admin" className="bnav-btn">
          <span className="bnav-icon">⚙</span>
          <span className="bnav-label">Admin</span>
        </Link>
      )}
    </nav>
  );
}
