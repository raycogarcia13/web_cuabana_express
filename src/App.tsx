import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Home from './components/Home';
import PWAInstall from './components/PWAInstall';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Efecto para logging de estado de autenticación
  useEffect(() => {
    if (!isLoading) {
      console.log('Estado de autenticación:', {
        isAuthenticated,
        user: user ? `${user.name} (${user.role})` : 'No autenticado'
      });
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <>
        <Home />
        <PWAInstall />
      </>
    );
  }

  return (
    <>
      <Login />
      <PWAInstall />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
