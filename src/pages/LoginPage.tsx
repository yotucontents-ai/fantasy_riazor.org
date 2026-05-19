import { useState, type FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiazorIcon } from '../components/RiazorIcon';

type Mode = 'login' | 'register';

export function LoginPage() {
  const location = useLocation();
  const initialMode: Mode = (location.state as { mode?: Mode })?.mode ?? 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!displayName.trim()) { setError('Introduce tu nombre'); setLoading(false); return; }
        await register(email, password, displayName.trim());
      }
      navigate('/');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos');
      } else if (code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado');
      } else if (code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else {
        setError('Error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><RiazorIcon size={28} /></div>
          <div className="auth-logo-name">Riazor<span>.org</span></div>
        </div>

        <div className="auth-title">{mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}</div>
        <div className="auth-sub">
          {mode === 'login'
            ? 'Accede a tu cuenta de Fantasy Riazor'
            : 'Únete a la liga Fantasy de Riazor.org'}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Nombre de usuario</label>
              <input
                className="form-input"
                type="text"
                placeholder="Como quieres aparecer en el ranking"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Cargando…' : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>¿No tienes cuenta? <a href="#" onClick={e => { e.preventDefault(); setMode('register'); setError(''); }}>Regístrate</a></>
          ) : (
            <>¿Ya tienes cuenta? <a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>Inicia sesión</a></>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/" style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
