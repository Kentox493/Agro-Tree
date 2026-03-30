import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PredictPage from './pages/PredictPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PlantsPage from './pages/PlantsPage';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import './index.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader-screen"><div className="spinner" /></div>;
  if (user) return <Navigate to="/app" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#064e3b',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.12)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          fontWeight: '600',
          fontSize: '14px',
          borderRadius: '100px',
          padding: '12px 24px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          style: {
            background: 'rgba(254, 242, 242, 0.95)',
            color: '#991b1b',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.12)',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }} />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="predict" element={<PredictPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="plants" element={<PlantsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
