import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LegalPopup from './components/LegalPopup';
import ChangelogPopup from './components/ChangelogPopup';
import MainPage from './pages/MainPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { PopupProvider, usePopups } from './context/PopupContext';
import { NotificationProvider } from './context/NotificationContext';
import { loginWithDiscord } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';


const ConfigPage = React.lazy(() => import('./pages/ConfigPage'));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

const AppContent = () => {
    const { user, loading } = useAuth();
    const { popups, closePopup } = usePopups();

    if (loading) return <div className="page-loading-skeleton" />;

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
        <Suspense fallback={<div className="page-loading-skeleton" />}>
            <LegalPopup isOpen={popups.legal} onClose={() => closePopup('legal')} />
            <ChangelogPopup isOpen={popups.changelog} onClose={() => closePopup('changelog')} />
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<MainPage />} />
                    <Route path="config" element={<ConfigPage />} />
                    <Route path="leaderboard" element={<LeaderboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

const App = () => (
    <NotificationProvider>
        <AuthProvider>
            <SettingsProvider>
                <PopupProvider>
                    <AppContent />
                </PopupProvider>
            </SettingsProvider>
        </AuthProvider>
    </NotificationProvider>
);

export default App;
