import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, type SecretSummary, type User } from '../api';
import { PageFrame } from '../components/PageFrame';

export function DashboardPage({
  user,
  onDeleteAccount,
}: {
  user: User | null;
  onDeleteAccount: () => void;
}) {
  const [secrets, setSecrets] = useState<SecretSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api<{ secrets: SecretSummary[] }>('/users/secrets/summary')
      .then((result) => setSecrets(result.secrets))
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Nachrichten konnten nicht geladen werden.',
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);

  async function deleteAccount() {
    if (
      !window.confirm(
        'Möchtest du dein Konto und alle dauerhaft gespeicherten Nachrichten wirklich löschen?',
      )
    )
      return;
    try {
      await api('/users/delete', { method: 'DELETE' });
      onDeleteAccount();
      navigate('/');
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Konto konnte nicht gelöscht werden.',
      );
    }
  }

  if (!user) return <Navigate to="/login" replace />;
  return (
    <PageFrame
      title={`Deine Übersicht`}
      intro={`Angemeldet als ${user.username}. Hier findest du deine dauerhaft gespeicherten Nachrichten.`}
    >
      <section className="dashboard-section" data-ui>
        <div className="dashboard-title">
          <div>
            <h2>Gespeicherte Nachrichten</h2>
            <p>
              {secrets.length}{' '}
              {secrets.length === 1 ? 'Nachricht' : 'Nachrichten'}
            </p>
          </div>
          <Link className="button button-primary" to="/send">
            Neue Nachricht <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {loading ? (
          <p className="empty-state">Nachrichten werden geladen …</p>
        ) : error ? (
          <div className="error-block" role="alert">
            <p>{error}</p>
            <button
              className="text-link"
              onClick={() => window.location.reload()}
              type="button"
            >
              Erneut versuchen
            </button>
          </div>
        ) : secrets.length === 0 ? (
          <div className="empty-state">
            <p>Hier ist noch nichts gespeichert.</p>
            <Link className="text-link" to="/send">
              Deine erste Nachricht erstellen ↗
            </Link>
          </div>
        ) : (
          <div className="secret-list" data-ui>
            {secrets.map((secret) => (
              <article className="secret-row" key={secret.id}>
                <div>
                  <code>{secret.id}</code>
                  <p>{secret.hasFile ? 'Mit Datei' : 'Textnachricht'}</p>
                </div>
                <div className="secret-opens">
                  <span>Öffnungen</span>
                  <strong>
                    {secret.opens} / {secret.burnsAfterXOpens}
                  </strong>
                </div>
                <span className="secret-state">Aktiv</span>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="account-section">
        <div>
          <h2>Konto</h2>
          <p>
            Deine Zugangsdaten und gespeicherten Nachrichten bleiben privat.
          </p>
        </div>
        <button
          className="text-link danger-link"
          onClick={deleteAccount}
          type="button"
        >
          Konto und Daten löschen
        </button>
      </section>
    </PageFrame>
  );
}
