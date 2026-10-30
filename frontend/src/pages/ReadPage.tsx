import { type FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { PageFrame } from '../components/PageFrame';
import { controlMessageForRead, decryptFile, decryptText } from '../crypto';

export function ReadPage() {
  const location = useLocation();
  const initialId = new URLSearchParams(location.search).get('messageId') || '';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [download, setDownload] = useState<{
    name: string;
    href: string;
  } | null>(null);
  const [openCount, setOpenCount] = useState<{
    opens: number;
    limit: number;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    setDownload(null);
    setOpenCount(null);
    const form = new FormData(event.currentTarget);
    const id = String(form.get('id') || '').trim();
    const password = String(form.get('password') || '');

    try {
      const details = await api<{
        exists: boolean;
        version?: number;
        salt?: string;
      }>(`/secrets/exists/${encodeURIComponent(id)}`);
      if (!details.exists)
        throw new Error(
          'Die Nachricht existiert nicht mehr oder ist abgelaufen.',
        );
      const controlmessage = await controlMessageForRead(
        password,
        details.version ?? 1,
        details.salt,
      );
      const data = await api<{
        message: string;
        opens: number;
        burnsAfterXOpens: number;
        file: { name: string; type: string; data: string } | null;
      }>(`/secrets/${encodeURIComponent(id)}`, {
        method: 'POST',
        body: JSON.stringify({ controlmessage }),
      });
      setMessage(await decryptText(data.message, password));
      setOpenCount({ opens: data.opens, limit: data.burnsAfterXOpens });
      if (data.file?.data) {
        const bytes = await decryptFile(data.file.data, password);
        const href = URL.createObjectURL(
          new Blob([bytes], {
            type: data.file.type || 'application/octet-stream',
          }),
        );
        setDownload({ name: data.file.name || 'datei', href });
      }
    } catch (readError) {
      const message = readError instanceof Error ? readError.message : '';
      if (message.includes('Invalid controlmessage'))
        setError('Das Passwort ist falsch.');
      else if (message.includes('Secret not found'))
        setError('Die Nachricht existiert nicht mehr oder ist abgelaufen.');
      else setError(message || 'Die Nachricht konnte nicht geöffnet werden.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download.href);
    },
    [download],
  );

  return (
    <PageFrame
      title="Nachricht lesen"
      intro="Gib den Link oder die Nachrichten-ID und das separat erhaltene Passwort ein."
    >
      <form className="form-panel read-form" onSubmit={submit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <label className="field">
          <span>Nachrichten-ID</span>
          <input
            name="id"
            defaultValue={initialId}
            required
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Passwort zum Entschlüsseln</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button
          className="button button-primary form-submit"
          disabled={busy}
          type="submit"
        >
          {busy ? 'Wird geöffnet …' : 'Nachricht entschlüsseln'}
        </button>
      </form>
      {message !== '' && (
        <section className="message-result" aria-live="polite">
          <p className="success-line">
            <span className="status-dot" />
            Nachricht entschlüsselt
          </p>
          <p className="decrypted-message">{message}</p>
          {openCount && (
            <p className="helper-text">
              Öffnung {openCount.opens} von {openCount.limit}
            </p>
          )}
          {download && (
            <a
              className="button button-secondary"
              href={download.href}
              download={download.name}
            >
              Datei herunterladen · {download.name}
            </a>
          )}
        </section>
      )}
    </PageFrame>
  );
}
