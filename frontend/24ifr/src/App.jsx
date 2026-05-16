import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LegalPopup, { LEGAL_POPUP_STORAGE_KEY } from './components/LegalPopup';
import ChangelogPopup, { CHANGELOG_POPUP_STORAGE_KEY } from './components/ChangelogPopup';
import MainPage from './pages/MainPage';
import { useAuth } from './context/AuthContext';
import { loginWithDiscord } from './services/api';

const ConfigPage = React.lazy(() => import('./pages/ConfigPage'));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

function App() {
  const { user, loading } = useAuth();
  const [isLegalPopupOpen, setIsLegalPopupOpen] = useState(false);
  const [isChangelogPopupOpen, setIsChangelogPopupOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    const dismissed = window.localStorage.getItem(LEGAL_POPUP_STORAGE_KEY) === 'true';
    if (!dismissed) {
      setIsLegalPopupOpen(true);
    }

    const changelogDismissed = window.localStorage.getItem(CHANGELOG_POPUP_STORAGE_KEY) === 'true';
    if (!changelogDismissed) {
      window.setTimeout(() => setIsChangelogPopupOpen(true), 600);
    }
  }, [user]);

  if (loading) {
    return <div className="page-loading-skeleton" />;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background-dark flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-border-dark bg-surface-dark p-8 text-center shadow-lg">
          <img src="/logo.png" alt="24IFR" className="mx-auto h-16 w-auto object-contain" />
          <button
            type="button"
            onClick={loginWithDiscord}
            className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:brightness-95"
          >
            Login with Discord
          </button>
        </div>
      </main>
    );
  }

  return (
    <React.Suspense fallback={<div className="page-loading-skeleton" />}>
      <LegalPopup isOpen={isLegalPopupOpen} onClose={() => setIsLegalPopupOpen(false)} />
      <ChangelogPopup isOpen={isChangelogPopupOpen} onClose={() => setIsChangelogPopupOpen(false)} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={(
              <MainPage
                onOpenLegalPopup={() => setIsLegalPopupOpen(true)}
              />
            )}
          />
          <Route path="config" element={<ConfigPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

export default App;
