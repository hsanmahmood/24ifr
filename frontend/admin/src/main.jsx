import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Toast from './components/Toast';
import './index.css';
import './styles/skeleton.css';

const root = createRoot(document.getElementById('root'));

root.render(
  
  <NotificationProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
    <Toast />
  </NotificationProvider>
);
