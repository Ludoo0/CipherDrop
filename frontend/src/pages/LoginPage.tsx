import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type User } from '../api';
import { PageFrame } from '../components/PageFrame';

export function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (user: User) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') || '').trim();
    const password = String(form.get('password') || '');
    const payload: Record<string, string> = { username, password };
    if (mode === 'register') {
      const email = String(form.get('email') || '').trim();
      if (new TextEncoder().encode(password).length > 72) {
        setError('Das Passwort darf höchstens 72 UTF-8-Bytes lang sein.');
        setBusy(false);
        return;
      }
      if (password !== String(form.get('confirmPassword') || '')) {
        setError('Die Passwörter stimmen nicht überein.');
        setBusy(false);
        return;
      }
      payload.email = email;
    }

    try {
      await api(mode === 'login' ? '/users/login' : '/users/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      onAuthenticated({ username, isAdmin: false });
      navigate('/dashboard');
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Anmeldung fehlgeschlagen.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageFrame
      title={mode === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}
      intro={
        mode === 'login'
          ? 'Melde dich an, um deine gespeicherten Nachrichten zu verwalten.'
          : 'Ein Konto ist optional und ermöglicht die dauerhafte Speicherung deiner Nachrichten.'
      }
    >
      <form className="form-panel auth-form" onSubmit={submit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {mode === 'register' && (
          <label className="field">
            <span>E-Mail-Adresse</span>
            <input
              name="email"
              type="email"
              maxLength={100}
              autoComplete="email"
              required
            />
          </label>
        )}
        <label className="field">
          <span>Benutzername</span>
          <input
            name="username"
            minLength={1}
            maxLength={50}
            autoComplete="username"
            required
          />
        </label>
        <label className="field">
          <span>Passwort</span>
          <input
            name="password"
            type="password"
            minLength={8}
            maxLength={mode === 'login' ? 255 : 72}
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            required
          />
          {mode === 'register' && (
            <small>Mindestens 8 Zeichen; maximal 72 UTF-8-Bytes.</small>
          )}
        </label>
        {mode === 'register' && (
          <label className="field">
            <span>Passwort wiederholen</span>
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              maxLength={255}
              autoComplete="new-password"
              required
            />
          </label>
        )}
        <button
          className="button button-primary form-submit"
          disabled={busy}
          type="submit"
        >
          {busy
            ? 'Einen Moment …'
            : mode === 'login'
              ? 'Anmelden'
              : 'Konto erstellen'}
        </button>
        <p className="switch-mode">
          {mode === 'login' ? 'Noch kein Konto?' : 'Schon registriert?'}{' '}
          <button
            type="button"
            className="inline-button"
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
          >
            {mode === 'login' ? 'Jetzt registrieren' : 'Zur Anmeldung'}
          </button>
        </p>
      </form>
    </PageFrame>
  );
}
