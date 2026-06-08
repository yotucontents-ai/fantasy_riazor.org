import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiazorIcon } from './RiazorIcon';

interface Props {
  currentRound?: number;
}

export function NavBar({ currentRound }: Props) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const initials = appUser?.displayName
    ? appUser.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    setMenuOpen(false);
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
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              className="nav-avatar"
              onClick={() => setMenuOpen(v => !v)}
              title={appUser.displayName}
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="user-menu">
                <div className="user-menu-name">{appUser.displayName}</div>
                <button className="user-menu-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  Ajustes de usuario
                </button>
                <button className="user-menu-item user-menu-logout" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="nav-avatar" title="Iniciar sesión">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </Link>
        )}
        <button className="nav-burger" onClick={() => setOpen(o => !o)}>
          {open ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
