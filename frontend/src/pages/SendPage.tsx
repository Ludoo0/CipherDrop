import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type User } from '../api';
import { PageFrame } from '../components/PageFrame';
import { createEncryptionContext } from '../crypto';

export function SendPage({ user }: { user: User | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setShareUrl('');
    setQrCode('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const message = String(form.get('message') || '');
    const password = String(form.get('password') || '');
    const expiry = String(form.get('ttl') || '3600');
    const file = (form.get('file') as File | null) || null;

    try {
      const encryption = await createEncryptionContext(password);
      const payload: Record<string, unknown> = {
        message: await encryption.encryptText(message),
        controlmessage: encryption.controlmessage,
        burnsAfterXOpens: Number(form.get('burns') || 1),
      };
      if (expiry !== 'never') payload.ttl = Number(expiry);
      if (file?.size) {
        if (file.size > 15 * 1024 * 1024)
          throw new Error('Die Datei darf höchstens 15 MB groß sein.');
        payload.file = await encryption.encryptFile(file);
      }
      const result = await api<{ id: string; qrCodeDataURL: string }>(
        '/secrets/register',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );
      setShareUrl(
        `${window.location.origin}/read?messageId=${encodeURIComponent(result.id)}`,
      );
      setQrCode(result.qrCodeDataURL);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Die Nachricht konnte nicht erstellt werden.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(
        'Der Link konnte nicht kopiert werden. Markiere ihn und kopiere ihn manuell.',
      );
    }
  }

  return (
    <PageFrame
      title="Nachricht senden"
      intro="Dein Inhalt wird verschlüsselt, bevor er deinen Browser verlässt."
    >
      {shareUrl ? (
        <section className="result-panel" aria-live="polite">
          <p className="success-line">
            <span className="status-dot" />
            Dein geheimer Link ist bereit
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <h2>Teile den Link und das Passwort getrennt.</h2>
          <div className="share-row">
            <input
              aria-label="Geheimer Nachrichtenlink"
              readOnly
              value={shareUrl}
            />
            <button
              className="button button-primary"
              onClick={copyLink}
              type="button"
            >
              {copied ? 'Kopiert' : 'Link kopieren'}
            </button>
          </div>
          <p className="helper-text">
            Das Passwort wird weder im Link noch auf dem Server gespeichert.
          </p>
          {qrCode && (
            <img
              className="qr-code"
              src={qrCode}
              alt="QR-Code zum Öffnen der Nachricht"
            />
          )}
          <button
            className="text-link reset-link"
            onClick={() => setShareUrl('')}
            type="button"
          >
            Weitere Nachricht erstellen
          </button>
        </section>
      ) : (
        <form className="form-panel" onSubmit={submit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label className="field field-full">
            <span>Deine Nachricht</span>
            <textarea
              name="message"
              rows={6}
              maxLength={5000}
              placeholder="Schreibe hier deine vertrauliche Nachricht …"
              required
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Passwort zum Verschlüsseln</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={255}
                required
              />
              <small>Mindestens 8 Zeichen. Teile es separat mit.</small>
            </label>
            <label className="field">
              <span>Nach dem wievielten Öffnen löschen?</span>
              <select name="burns" defaultValue="1">
                <option value="1">Nach 1 Öffnung</option>
                <option value="2">Nach 2 Öffnungen</option>
                <option value="5">Nach 5 Öffnungen</option>
                <option value="10">Nach 10 Öffnungen</option>
              </select>
            </label>
            <label className="field">
              <span>Ablaufzeit</span>
              <select name="ttl" defaultValue="3600">
                <option value="3600">1 Stunde</option>
                <option value="21600">6 Stunden</option>
                <option value="86400">24 Stunden</option>
                {user && (
                  <option value="never">
                    Unbegrenzt, in deinem Konto gespeichert
                  </option>
                )}
              </select>
            </label>
            <label className="field">
              <span>
                Datei anhängen <small>(optional, bis 15 MB)</small>
              </span>
              <input name="file" type="file" />
              <small>Die Datei wird im Browser verschlüsselt.</small>
            </label>
          </div>
          {!user && (
            <p className="notice">
              Ohne Konto läuft der Link nach der gewählten Zeit ab.{' '}
              <Link to="/login">Konto erstellen</Link>, um Nachrichten dauerhaft
              zu speichern.
            </p>
          )}
          <button
            className="button button-primary form-submit"
            disabled={busy}
            type="submit"
          >
            {busy ? 'Wird verschlüsselt …' : 'Verschlüsseln und Link erstellen'}
          </button>
        </form>
      )}
    </PageFrame>
  );
}
