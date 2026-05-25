import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import LegalPopup from './components/LegalPopup';
import ChangelogPopup, { CHANGELOG_POPUP_STORAGE_KEY } from './components/ChangelogPopup';
import MainPage from './pages/MainPage';
import AboutPopup from './components/AboutPopup';
import SupportPopup from './components/SupportPopup';
import { loadPublicDocuments } from './services/api';
import { useAuth } from './context/AuthContext';
import { useNotification } from './context/NotificationContext';
import LoginScreen from './components/LoginScreen';

const ConfigPage = React.lazy(() => import('./pages/ConfigPage'));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

function App() {
  const { user, loading } = useAuth();
  const { notify } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLegalPopupOpen, setIsLegalPopupOpen] = useState(false);
  const [isChangelogPopupOpen, setIsChangelogPopupOpen] = useState(false);
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);
  const [isSupportPopupOpen, setIsSupportPopupOpen] = useState(false);
  const [publicDocs, setPublicDocs] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const auth = params.get('auth');
    const error = params.get('error');

    if (!auth && !error) {
      return;
    }

    if (auth === 'success') {
      notify.success('Logged in successfully');
    } else if (error) {
      const errorMessages = {
        discord_auth_failed: 'Discord authentication failed. Please try again.',
        db_error: 'Login completed, but we could not finish syncing your account.',
        access_denied: 'Discord login was cancelled or denied.',
      };

      notify.error(errorMessages[error] || 'Authentication failed. Please try again.');
    }

    navigate('/', { replace: true });
  }, [location.search, navigate]);

  useEffect(() => {
    const checkDocs = async () => {
      const docs = await loadPublicDocuments();
      setPublicDocs(docs);

      const changelog = docs.find(d => d.doc_key === 'changelog');
      if (changelog) {
        let updatedAt = '';
        try {
          updatedAt = changelog.updated_at ? new Date(changelog.updated_at).toISOString() : '';
        } catch (e) {
          updatedAt = String(changelog.updated_at || '');
        }

        const keyUpdated = CHANGELOG_POPUP_STORAGE_KEY;
        const prev = window.localStorage.getItem(keyUpdated) || '';
        if (!prev) {
          window.localStorage.setItem(keyUpdated, updatedAt);
          window.setTimeout(() => setIsChangelogPopupOpen(true), 600);
        } else if (prev !== updatedAt) {
          window.localStorage.setItem(keyUpdated, updatedAt);
          window.setTimeout(() => setIsChangelogPopupOpen(true), 600);
        }
      }
    };

    checkDocs();
  }, []);

  if (loading) {
    return <div className="page-loading-skeleton" />;
  }

  if (!user) {
    return (
      <>
        <LegalPopup isOpen={isLegalPopupOpen} onClose={() => setIsLegalPopupOpen(false)} content={publicDocs.find(d => d.doc_key === 'privacy_terms')?.content_md || ''} />
        <ChangelogPopup isOpen={isChangelogPopupOpen} onClose={() => setIsChangelogPopupOpen(false)} content={publicDocs.find(d => d.doc_key === 'changelog')?.content_md || ''} />
        <LoginScreen onOpenLegalPopup={() => setIsLegalPopupOpen(true)} />
      </>
    );
  }

  return (
    <React.Suspense fallback={<div className="page-loading-skeleton" />}>
      <LegalPopup isOpen={isLegalPopupOpen} onClose={() => setIsLegalPopupOpen(false)} content={publicDocs.find(d => d.doc_key === 'privacy_terms')?.content_md || ''} />
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
