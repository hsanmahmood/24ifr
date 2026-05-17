import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LegalPopup, { LEGAL_POPUP_STORAGE_KEY } from './components/LegalPopup';
import ChangelogPopup, { CHANGELOG_POPUP_STORAGE_KEY } from './components/ChangelogPopup';
import MainPage from './pages/MainPage';
import AboutPopup from './components/AboutPopup';
import SupportPopup from './components/SupportPopup';
import { loadPublicDocuments } from './services/api';
import { useAuth } from './context/AuthContext';
import { loginWithDiscord } from './services/api';

const ConfigPage = React.lazy(() => import('./pages/ConfigPage'));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

function App() {
  const { user, loading } = useAuth();
  const [isLegalPopupOpen, setIsLegalPopupOpen] = useState(false);
  const [isChangelogPopupOpen, setIsChangelogPopupOpen] = useState(false);
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);
  const [isSupportPopupOpen, setIsSupportPopupOpen] = useState(false);
  const [publicDocs, setPublicDocs] = useState([]);
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);

  // Discord login redirect disabled - auth is skipped in development
  // useEffect(() => {
  //   if (loading || user || redirectingToLogin) {
  //     return;
  //   }
  //   setRedirectingToLogin(true);
  //   loginWithDiscord();
  // }, [loading, user, redirectingToLogin]);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(LEGAL_POPUP_STORAGE_KEY) === 'true';
    if (!dismissed) setIsLegalPopupOpen(true);

    const checkDocs = async () => {
      const docs = await loadPublicDocuments();
      setPublicDocs(docs);

      const changelog = docs.find(d => d.doc_key === 'changelog');
      if (changelog) {
        const keyUpdated = '24ifr_changelog_updated_at_v1';
        const prev = window.localStorage.getItem(keyUpdated) || '';
        const updatedAt = changelog.updated_at || '';
        if (prev !== updatedAt) {
          window.localStorage.setItem(CHANGELOG_POPUP_STORAGE_KEY, 'false');
          window.localStorage.setItem(keyUpdated, updatedAt);
        }
      }

      const changelogDismissed = window.localStorage.getItem(CHANGELOG_POPUP_STORAGE_KEY) === 'true';
      if (!changelogDismissed) {
        window.setTimeout(() => setIsChangelogPopupOpen(true), 600);
      }
    };

    checkDocs();
  }, []);

  if (loading) {
    return <div className="page-loading-skeleton" />;
  }

  return (
    <React.Suspense fallback={<div className="page-loading-skeleton" />}>
      <LegalPopup isOpen={isLegalPopupOpen} onClose={() => setIsLegalPopupOpen(false)} />
      <ChangelogPopup isOpen={isChangelogPopupOpen} onClose={() => setIsChangelogPopupOpen(false)} content={publicDocs.find(d => d.doc_key === 'changelog')?.content_md || ''} />
      <AboutPopup isOpen={isAboutPopupOpen} onClose={() => setIsAboutPopupOpen(false)} content={publicDocs.find(d => d.doc_key === 'credits')?.content_md || ''} />
      <SupportPopup isOpen={isSupportPopupOpen} onClose={() => setIsSupportPopupOpen(false)} content={publicDocs.find(d => d.doc_key === 'support')?.content_md || ''} />

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={(
              <MainPage
                onOpenLegalPopup={() => setIsLegalPopupOpen(true)}
                onOpenAboutPopup={() => setIsAboutPopupOpen(true)}
                onOpenSupportPopup={() => setIsSupportPopupOpen(true)}
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
