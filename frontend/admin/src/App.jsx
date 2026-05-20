import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminPanelPage from './pages/AdminPanelPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { useNotification } from './context/NotificationContext';

function App() {
  const { notify } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
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

  return (
    <React.Suspense fallback={<div className="page-loading-skeleton" />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AdminPanelPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

export default App;
