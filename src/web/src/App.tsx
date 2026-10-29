import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api, type SecretSummary, type User } from "./api";
import { controlMessageForRead, createEncryptionContext, decryptFile, decryptText } from "./crypto";

type SessionResponse = { loggedIn: boolean; username: string; isAdmin: boolean };

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [sessionLoaded, setSessionLoaded] = useState(false);

    useEffect(() => {
        api<SessionResponse>("/users/loginstatus")
            .then((session) => setUser({ username: session.username, isAdmin: session.isAdmin }))
            .catch(() => setUser(null))
            .finally(() => setSessionLoaded(true));
    }, []);

    return (
        <div className="app-shell">
            <SiteHeader user={user} onLogout={() => setUser(null)} />
            <main id="main-content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/send" element={<SendPage user={user} />} />
                    <Route path="/read" element={<ReadPage />} />
                    <Route path="/login" element={<LoginPage onAuthenticated={setUser} />} />
                    <Route path="/dashboard" element={sessionLoaded ? <DashboardPage user={user} onDeleteAccount={() => setUser(null)} /> : <LoadingPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <SiteFooter />
        </div>
    );
}

function SiteHeader({ user, onLogout }: { user: User | null; onLogout: () => void }) {
    const navigate = useNavigate();
    async function logout() {
        try {
            await api("/users/logout", { method: "DELETE" });
            onLogout();
            navigate("/");
        } catch (error) {
            window.alert(error instanceof Error ? error.message : "Abmelden fehlgeschlagen.");
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
                {user ? <NavLink to="/dashboard">Übersicht</NavLink> : <NavLink to="/login">Konto</NavLink>}
                {user && <button className="nav-action" onClick={logout}>Abmelden</button>}
            </nav>
        </header>
    );
}

function HomePage() {
    return (
        <>
            <section className="home-hero content-width">
                <div className="hero-copy">
                    <h1>Private Nachrichten. Auf Zeit.</h1>
                    <p className="hero-lede">Verschlüssle eine Nachricht auf deinem Gerät. Teile den Link und das Passwort getrennt. Nach dem Lesen verschwindet sie.</p>
                    <div className="hero-actions">
                        <Link className="button button-primary" to="/send">Nachricht erstellen <span aria-hidden="true">↗</span></Link>
                        <Link className="text-link" to="/read">Nachricht öffnen</Link>
                    </div>
                    <p className="hero-note">Dein Passwort und der lesbare Inhalt werden nie an CipherDrop gesendet.</p>
                </div>
                <div className="hero-paper" aria-label="Ablauf einer geteilten Nachricht">
                    <div className="paper-topline"><span className="status-dot" />Nur für dich und den Empfänger</div>
                    <div className="paper-message">Ein Geheimnis bleibt privat, bis du es teilst.</div>
                    <div className="paper-footer"><span>Verschlüsselt im Browser</span><span>Selbstlöschend</span></div>
                </div>
            </section>
            <section className="home-explainer content-width">
                <div className="section-heading">
                    <h2>Teilen, ohne den Inhalt preiszugeben.</h2>
                </div>
                <div className="steps-list">
                    <article><h3>Auf deinem Gerät verschlüsseln</h3><p>Nachricht und Datei werden im Browser mit deinem Passwort verschlüsselt.</p></article>
                    <article><h3>Link und Passwort teilen</h3><p>Der Server speichert nur verschlüsselte Daten. Sende das Passwort am besten über einen anderen Weg.</p></article>
                    <article><h3>Automatisch löschen</h3><p>Lege eine Ablaufzeit und die maximale Zahl der Öffnungen fest.</p></article>
                </div>
            </section>
            <section className="home-cta content-width">
                <div><h2>Bereit zum Teilen?</h2><p>Erstelle einen einmaligen Link für deine nächste vertrauliche Nachricht.</p></div>
                <Link className="button button-light" to="/send">Nachricht erstellen <span aria-hidden="true">↗</span></Link>
            </section>
        </>
    );
}

function SendPage({ user }: { user: User | null }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [shareUrl, setShareUrl] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [copied, setCopied] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setShareUrl("");
        setQrCode("");
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const message = String(form.get("message") || "");
        const password = String(form.get("password") || "");
        const expiry = String(form.get("ttl") || "3600");
        const file = (form.get("file") as File | null) || null;

        try {
            const encryption = await createEncryptionContext(password);
            const payload: Record<string, unknown> = {
                message: await encryption.encryptText(message),
                controlmessage: encryption.controlmessage,
                burnsAfterXOpens: Number(form.get("burns") || 1),
            };
            if (expiry !== "never") payload.ttl = Number(expiry);
            if (file?.size) {
                if (file.size > 15 * 1024 * 1024) throw new Error("Die Datei darf höchstens 15 MB groß sein.");
                payload.file = await encryption.encryptFile(file);
            }
            const result = await api<{ id: string; qrCodeDataURL: string }>("/secrets/register", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            setShareUrl(`${window.location.origin}/read?messageId=${encodeURIComponent(result.id)}`);
            setQrCode(result.qrCodeDataURL);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Die Nachricht konnte nicht erstellt werden.");
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
            setError("Der Link konnte nicht kopiert werden. Markiere ihn und kopiere ihn manuell.");
        }
    }

    return (
        <PageFrame title="Nachricht senden" intro="Dein Inhalt wird verschlüsselt, bevor er deinen Browser verlässt.">
            {shareUrl ? (
                <section className="result-panel" aria-live="polite">
                    <p className="success-line"><span className="status-dot" />Dein geheimer Link ist bereit</p>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <h2>Teile den Link und das Passwort getrennt.</h2>
                    <div className="share-row"><input aria-label="Geheimer Nachrichtenlink" readOnly value={shareUrl} /><button className="button button-primary" onClick={copyLink}>{copied ? "Kopiert" : "Link kopieren"}</button></div>
                    <p className="helper-text">Das Passwort wird weder im Link noch auf dem Server gespeichert.</p>
                    {qrCode && <img className="qr-code" src={qrCode} alt="QR-Code zum Öffnen der Nachricht" />}
                    <button className="text-link reset-link" onClick={() => setShareUrl("")}>Weitere Nachricht erstellen</button>
                </section>
            ) : (
                <form className="form-panel" onSubmit={submit}>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <label className="field field-full"><span>Deine Nachricht</span><textarea name="message" rows={6} maxLength={5000} placeholder="Schreibe hier deine vertrauliche Nachricht …" required /></label>
                    <div className="form-grid">
                        <label className="field"><span>Passwort zum Verschlüsseln</span><input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={255} required /><small>Mindestens 8 Zeichen. Teile es separat mit.</small></label>
                        <label className="field"><span>Nach dem wievielten Öffnen löschen?</span><select name="burns" defaultValue="1"><option value="1">Nach 1 Öffnung</option><option value="2">Nach 2 Öffnungen</option><option value="5">Nach 5 Öffnungen</option><option value="10">Nach 10 Öffnungen</option></select></label>
                        <label className="field"><span>Ablaufzeit</span><select name="ttl" defaultValue="3600"><option value="3600">1 Stunde</option><option value="21600">6 Stunden</option><option value="86400">24 Stunden</option>{user && <option value="never">Unbegrenzt, in deinem Konto gespeichert</option>}</select></label>
                        <label className="field"><span>Datei anhängen <small>(optional, bis 15 MB)</small></span><input name="file" type="file" /><small>Die Datei wird im Browser verschlüsselt.</small></label>
                    </div>
                    {!user && <p className="notice">Ohne Konto läuft der Link nach der gewählten Zeit ab. <Link to="/login">Konto erstellen</Link>, um Nachrichten dauerhaft zu speichern.</p>}
                    <button className="button button-primary form-submit" disabled={busy}>{busy ? "Wird verschlüsselt …" : "Verschlüsseln und Link erstellen"}</button>
                </form>
            )}
        </PageFrame>
    );
}

function ReadPage() {
    const location = useLocation();
    const initialId = new URLSearchParams(location.search).get("messageId") || "";
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [download, setDownload] = useState<{ name: string; href: string } | null>(null);
    const [openCount, setOpenCount] = useState<{ opens: number; limit: number } | null>(null);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setMessage("");
        setDownload(null);
        setOpenCount(null);
        const form = new FormData(event.currentTarget);
        const id = String(form.get("id") || "").trim();
        const password = String(form.get("password") || "");

        try {
            const details = await api<{ exists: boolean; version?: number; salt?: string }>(`/secrets/exists/${encodeURIComponent(id)}`);
            if (!details.exists) throw new Error("Die Nachricht existiert nicht mehr oder ist abgelaufen.");
            const controlmessage = await controlMessageForRead(password, details.version ?? 1, details.salt);
            const data = await api<{ message: string; opens: number; burnsAfterXOpens: number; file: { name: string; type: string; data: string } | null }>(`/secrets/${encodeURIComponent(id)}`, {
                method: "POST",
                body: JSON.stringify({ controlmessage }),
            });
            setMessage(await decryptText(data.message, password));
            setOpenCount({ opens: data.opens, limit: data.burnsAfterXOpens });
            if (data.file?.data) {
                const bytes = await decryptFile(data.file.data, password);
                const href = URL.createObjectURL(new Blob([bytes], { type: data.file.type || "application/octet-stream" }));
                setDownload({ name: data.file.name || "datei", href });
            }
        } catch (readError) {
            const message = readError instanceof Error ? readError.message : "";
            if (message.includes("Invalid controlmessage")) setError("Das Passwort ist falsch.");
            else if (message.includes("Secret not found")) setError("Die Nachricht existiert nicht mehr oder ist abgelaufen.");
            else setError(message || "Die Nachricht konnte nicht geöffnet werden.");
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => () => { if (download) URL.revokeObjectURL(download.href); }, [download]);

    return (
        <PageFrame title="Nachricht lesen" intro="Gib den Link oder die Nachrichten-ID und das separat erhaltene Passwort ein.">
            <form className="form-panel read-form" onSubmit={submit}>
                {error && <p className="form-error" role="alert">{error}</p>}
                <label className="field"><span>Nachrichten-ID</span><input name="id" defaultValue={initialId} required autoComplete="off" /></label>
                <label className="field"><span>Passwort zum Entschlüsseln</span><input name="password" type="password" autoComplete="current-password" required /></label>
                <button className="button button-primary form-submit" disabled={busy}>{busy ? "Wird geöffnet …" : "Nachricht entschlüsseln"}</button>
            </form>
            {message !== "" && <section className="message-result" aria-live="polite"><p className="success-line"><span className="status-dot" />Nachricht entschlüsselt</p><p className="decrypted-message">{message}</p>{openCount && <p className="helper-text">Öffnung {openCount.opens} von {openCount.limit}</p>}{download && <a className="button button-secondary" href={download.href} download={download.name}>Datei herunterladen · {download.name}</a>}</section>}
        </PageFrame>
    );
}

function LoginPage({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const username = String(form.get("username") || "").trim();
        const password = String(form.get("password") || "");
        const payload: Record<string, string> = { username, password };
        if (mode === "register") {
            const email = String(form.get("email") || "").trim();
            if (new TextEncoder().encode(password).length > 72) {
                setError("Das Passwort darf höchstens 72 UTF-8-Bytes lang sein.");
                setBusy(false);
                return;
            }
            if (password !== String(form.get("confirmPassword") || "")) {
                setError("Die Passwörter stimmen nicht überein.");
                setBusy(false);
                return;
            }
            payload.email = email;
        }

        try {
            await api(mode === "login" ? "/users/login" : "/users/register", { method: "POST", body: JSON.stringify(payload) });
            onAuthenticated({ username, isAdmin: false });
            navigate("/dashboard");
        } catch (authError) {
            setError(authError instanceof Error ? authError.message : "Anmeldung fehlgeschlagen.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <PageFrame title={mode === "login" ? "Willkommen zurück" : "Konto erstellen"} intro={mode === "login" ? "Melde dich an, um deine gespeicherten Nachrichten zu verwalten." : "Ein Konto ist optional und ermöglicht die dauerhafte Speicherung deiner Nachrichten."}>
            <form className="form-panel auth-form" onSubmit={submit}>
                {error && <p className="form-error" role="alert">{error}</p>}
                {mode === "register" && <label className="field"><span>E-Mail-Adresse</span><input name="email" type="email" maxLength={100} autoComplete="email" required /></label>}
                <label className="field"><span>Benutzername</span><input name="username" minLength={1} maxLength={50} autoComplete="username" required /></label>
                <label className="field"><span>Passwort</span><input name="password" type="password" minLength={8} maxLength={mode === "login" ? 255 : 72} autoComplete={mode === "login" ? "current-password" : "new-password"} required />{mode === "register" && <small>Mindestens 8 Zeichen; maximal 72 UTF-8-Bytes.</small>}</label>
                {mode === "register" && <label className="field"><span>Passwort wiederholen</span><input name="confirmPassword" type="password" minLength={8} maxLength={255} autoComplete="new-password" required /></label>}
                <button className="button button-primary form-submit" disabled={busy}>{busy ? "Einen Moment …" : mode === "login" ? "Anmelden" : "Konto erstellen"}</button>
                <p className="switch-mode">{mode === "login" ? "Noch kein Konto?" : "Schon registriert?"} <button type="button" className="inline-button" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }}>{mode === "login" ? "Jetzt registrieren" : "Zur Anmeldung"}</button></p>
            </form>
        </PageFrame>
    );
}

function DashboardPage({ user, onDeleteAccount }: { user: User | null; onDeleteAccount: () => void }) {
    const [secrets, setSecrets] = useState<SecretSummary[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        api<{ secrets: SecretSummary[] }>("/users/secrets/summary")
            .then((result) => setSecrets(result.secrets))
            .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Nachrichten konnten nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [user]);

    async function deleteAccount() {
        if (!window.confirm("Möchtest du dein Konto und alle dauerhaft gespeicherten Nachrichten wirklich löschen?")) return;
        try {
            await api("/users/delete", { method: "DELETE" });
            onDeleteAccount();
            navigate("/");
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Konto konnte nicht gelöscht werden.");
        }
    }

    if (!user) return <Navigate to="/login" replace />;
    return (
        <PageFrame title={`Deine Übersicht`} intro={`Angemeldet als ${user.username}. Hier findest du deine dauerhaft gespeicherten Nachrichten.`}>
            <section className="dashboard-section" data-ui>
                <div className="dashboard-title"><div><h2>Gespeicherte Nachrichten</h2><p>{secrets.length} {secrets.length === 1 ? "Nachricht" : "Nachrichten"}</p></div><Link className="button button-primary" to="/send">Neue Nachricht <span aria-hidden="true">↗</span></Link></div>
                {loading ? <p className="empty-state">Nachrichten werden geladen …</p> : error ? <div className="error-block" role="alert"><p>{error}</p><button className="text-link" onClick={() => window.location.reload()}>Erneut versuchen</button></div> : secrets.length === 0 ? <div className="empty-state"><p>Hier ist noch nichts gespeichert.</p><Link className="text-link" to="/send">Deine erste Nachricht erstellen ↗</Link></div> : (
                    <div className="secret-list" data-ui>
                        {secrets.map((secret) => <article className="secret-row" key={secret.id}><div><code>{secret.id}</code><p>{secret.hasFile ? "Mit Datei" : "Textnachricht"}</p></div><div className="secret-opens"><span>Öffnungen</span><strong>{secret.opens} / {secret.burnsAfterXOpens}</strong></div><span className="secret-state">Aktiv</span></article>)}
                    </div>
                )}
            </section>
            <section className="account-section"><div><h2>Konto</h2><p>Deine Zugangsdaten und gespeicherten Nachrichten bleiben privat.</p></div><button className="text-link danger-link" onClick={deleteAccount}>Konto und Daten löschen</button></section>
        </PageFrame>
    );
}

function PageFrame({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
    return <section className="page-frame content-width"><div className="page-intro"><h1>{title}</h1><p>{intro}</p></div>{children}</section>;
}

function LoadingPage() {
    return <section className="page-frame content-width"><p role="status">Lade Konto …</p></section>;
}

function SiteFooter() {
    return <footer className="site-footer"><Link className="brand" to="/"><img src="/assets/logo_white.png" alt="" /><span>CipherDrop</span></Link><p>Private Nachrichten, direkt auf deinem Gerät verschlüsselt.</p><Link to="/read">Nachricht öffnen ↗</Link></footer>;
}

export default App;
