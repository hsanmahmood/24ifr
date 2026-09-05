import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LegalPopup, { LEGAL_POPUP_STORAGE_KEY } from './components/LegalPopup';
import ChangelogPopup, { CHANGELOG_POPUP_STORAGE_KEY } from './components/ChangelogPopup';
import AdminPanelPage from './pages/AdminPanelPage';

const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const FeedbackPage = React.lazy(() => import('./pages/FeedbackPage'));
const AdvertisementsPage = React.lazy(() => import('./pages/AdvertisementsPage'));

function App() {
  const [isLegalPopupOpen, setIsLegalPopupOpen] = useState(false);
  const [isChangelogPopupOpen, setIsChangelogPopupOpen] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(LEGAL_POPUP_STORAGE_KEY) === 'true';
    if (!dismissed) {
      setIsLegalPopupOpen(true);
    }

    const changelogDismissed = window.localStorage.getItem(CHANGELOG_POPUP_STORAGE_KEY) === 'true';
    if (!changelogDismissed) {
      window.setTimeout(() => setIsChangelogPopupOpen(true), 600);
    }
  }, []);

  return (
    <React.Suspense fallback={<div className="page-loading-skeleton" />}>
      <LegalPopup isOpen={isLegalPopupOpen} onClose={() => setIsLegalPopupOpen(false)} />
      <ChangelogPopup isOpen={isChangelogPopupOpen} onClose={() => setIsChangelogPopupOpen(false)} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={(
              <AdminPanelPage
                onOpenLegalPopup={() => setIsLegalPopupOpen(true)}
              />
            )}
          />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="advertisements" element={<AdvertisementsPage />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

export default App;
