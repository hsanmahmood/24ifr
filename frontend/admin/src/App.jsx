import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminPanelPage from './pages/AdminPanelPage';

function App() {
  return (
    <React.Suspense fallback={<div className="page-loading-skeleton" />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AdminPanelPage />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

export default App;
