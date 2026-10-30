import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api, type User } from '../api';

export function SiteHeader({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  async function logout() {
    try {
      await api('/users/logout', { method: 'DELETE' });
      onLogout();
      navigate('/');
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Abmelden fehlgeschlagen.',
      );
    }
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="CipherDrop Startseite">
        <img src="/assets/logo_white.png" alt="" />
        <span>CipherDrop</span>
      </Link>
      <nav className="main-nav" aria-label="Hauptnavigation">
        <NavLink to="/send">Nachricht senden</NavLink>
        <NavLink to="/read">Nachricht lesen</NavLink>
        {user ? (
          <NavLink to="/dashboard">Übersicht</NavLink>
        ) : (
          <NavLink to="/login">Konto</NavLink>
        )}
        {user && (
          <button className="nav-action" onClick={logout} type="button">
            Abmelden
          </button>
        )}
      </nav>
    </header>
  );
}
