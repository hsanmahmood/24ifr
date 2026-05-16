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
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);

  useEffect(() => {
    if (loading || user || redirectingToLogin) {
      return;
    }
    setRedirectingToLogin(true);
    loginWithDiscord();
  }, [loading, user, redirectingToLogin]);

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

  if (loading || !user) {
    return <div className="page-loading-skeleton" />;
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
