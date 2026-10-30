import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <>
      <section className="home-hero content-width">
        <div className="hero-copy">
          <h1>Private Nachrichten. Auf Zeit.</h1>
          <p className="hero-lede">
            Verschlüssle eine Nachricht auf deinem Gerät. Teile den Link und das
            Passwort getrennt. Nach dem Lesen verschwindet sie.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/send">
              Nachricht erstellen <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" to="/read">
              Nachricht öffnen
            </Link>
          </div>
          <p className="hero-note">
            Dein Passwort und der lesbare Inhalt werden nie an CipherDrop
            gesendet.
          </p>
        </div>
        <div className="hero-paper">
          <div className="paper-topline">
            <span className="status-dot" />
            Nur für dich und den Empfänger
          </div>
          <div className="paper-message">
            Ein Geheimnis bleibt privat, bis du es teilst.
          </div>
          <div className="paper-footer">
            <span>Verschlüsselt im Browser</span>
            <span>Selbstlöschend</span>
          </div>
        </div>
      </section>
      <section className="home-explainer content-width">
        <div className="section-heading">
          <h2>Teilen, ohne den Inhalt preiszugeben.</h2>
        </div>
        <div className="steps-list">
          <article>
            <h3>Auf deinem Gerät verschlüsseln</h3>
            <p>
              Nachricht und Datei werden im Browser mit deinem Passwort
              verschlüsselt.
            </p>
          </article>
          <article>
            <h3>Link und Passwort teilen</h3>
            <p>
              Der Server speichert nur verschlüsselte Daten. Sende das Passwort
              am besten über einen anderen Weg.
            </p>
          </article>
          <article>
            <h3>Automatisch löschen</h3>
            <p>
              Lege eine Ablaufzeit und die maximale Zahl der Öffnungen fest.
            </p>
          </article>
        </div>
      </section>
      <section className="home-cta content-width">
        <div>
          <h2>Bereit zum Teilen?</h2>
          <p>
            Erstelle einen einmaligen Link für deine nächste vertrauliche
            Nachricht.
          </p>
        </div>
        <Link className="button button-light" to="/send">
          Nachricht erstellen <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </>
  );
}
