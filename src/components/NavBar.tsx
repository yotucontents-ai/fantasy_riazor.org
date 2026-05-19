import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiazorIcon } from './RiazorIcon';

interface Props {
  currentRound?: number;
}

export function NavBar({ currentRound }: Props) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveSection(e.target.id);
      });
    }, { threshold: 0.35 });
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, []);

  const initials = appUser?.displayName
    ? appUser.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function navLink(href: string, label: string) {
    const id = href.replace('#', '');
    return (
      <li>
        <a
          href={href}
          data-nav
          className={activeSection === id ? 'active' : ''}
          onClick={() => setOpen(false)}
        >
          {label}
        </a>
      </li>
    );
  }

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        <div className="nav-icon"><RiazorIcon size={22} /></div>
        <span className="nav-brand-text">Riazor</span>
        <span className="nav-brand-org">.org</span>
        <span className="nav-badge">Fantasy</span>
      </Link>

      <ul className={`nav-links${open ? ' open' : ''}`} id="navLinks">
        {navLink('#inicio', 'Inicio')}
        {navLink('#como', 'Cómo funciona')}
        {navLink('#once', 'Mi Once')}
        {navLink('#plantilla', 'Plantilla')}
        {navLink('#clasificacion', 'Clasificación')}
        {appUser?.role === 'admin' && (
          <li><Link to="/admin" onClick={() => setOpen(false)}>⚙ Admin</Link></li>
        )}
      </ul>

      <div className="nav-right">
        {currentRound && (
          <span className="nav-jornada">Jornada {currentRound}</span>
        )}
        {appUser ? (
          <div
            className="nav-avatar"
            title={`${appUser.displayName} · Cerrar sesión`}
            onClick={handleLogout}
          >
            {initials}
          </div>
        ) : (
          <Link to="/login" className="nav-avatar" title="Iniciar sesión">?</Link>
        )}
        <button className="nav-burger" onClick={() => setOpen(o => !o)}>
          {open ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
