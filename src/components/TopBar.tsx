import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiazorIcon } from './RiazorIcon';
import { Countdown } from './Countdown';
import type { Round } from '../types';

interface Props {
  round: Round | null;
}

export function TopBar({ round }: Props) {
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = appUser?.displayName
    ? appUser.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : null;

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <RiazorIcon size={20} />
        <span>Riazor<span className="org">.org</span></span>
        <span className="top-bar-badge">Fantasy</span>
      </div>

      <div className="top-bar-middle">
        {round?.status === 'open' && (
          <>
            <span className="top-bar-round">J{round.number}</span>
            <span style={{ color: 'var(--text-muted)', marginRight: '.3rem' }}>· Cierra en</span>
            <Countdown deadline={round.deadline} />
          </>
        )}
      </div>

      <div className="top-bar-user">
        {appUser ? (
          <div ref={menuRef}>
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
      </div>
    </header>
  );
}
