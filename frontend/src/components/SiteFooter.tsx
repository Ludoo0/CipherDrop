import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="brand" to="/">
        <img src="/assets/logo_white.png" alt="" />
        <span>CipherDrop</span>
      </Link>
      <p>Private Nachrichten, direkt auf deinem Gerät verschlüsselt.</p>
      <Link to="/read">Nachricht öffnen ↗</Link>
    </footer>
  );
}
