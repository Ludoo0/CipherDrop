import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api, type User } from './api';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ReadPage } from './pages/ReadPage';
import { SendPage } from './pages/SendPage';

type SessionResponse = {
  loggedIn: boolean;
  username: string;
  isAdmin: boolean;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    api<SessionResponse>('/users/loginstatus')
      .then((session) =>
        setUser({ username: session.username, isAdmin: session.isAdmin }),
      )
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
          <Route
            path="/login"
            element={<LoginPage onAuthenticated={setUser} />}
          />
          <Route
            path="/dashboard"
            element={
              sessionLoaded ? (
                <DashboardPage
                  user={user}
                  onDeleteAccount={() => setUser(null)}
                />
              ) : (
                <LoadingPage />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}

function LoadingPage() {
  return (
    <section className="page-frame content-width">
      <p role="status">Lade Konto …</p>
    </section>
  );
}

export default App;
