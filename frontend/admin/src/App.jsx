import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminPanelPage from './pages/AdminPanelPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
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
