import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log(e)
    e.preventDefault();
    await performLogin();
  };

  const performLogin = async () => {
    setIsLoading(true);
    setError('');
    
    // Validación básica del lado del cliente
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico');
      setIsLoading(false);
      return;
    }
    
    if (!password.trim()) {
      setError('Por favor, ingresa tu contraseña');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log(email, password);
      const response = await login({ email, password });
      if (!response.success) {
        // Manejar diferentes tipos de errores de la API
        if (response.message) {
          setError(response.message);
        } else {
          setError('Error de autenticación. Verifica tus credenciales.');
        }
      }
    } catch (error) {
      console.error('Error durante el login:', error);
      setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Cubana Express</h1>
          <p>Inicia sesión en tu cuenta</p>
        </div>
        
        {error && (
          <div className="error-message" onClick={clearError}>
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button className="error-close" onClick={clearError}>×</button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) clearError(); // Limpiar error cuando el usuario empiece a escribir
              }}
              placeholder="tu@email.com"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError(); // Limpiar error cuando el usuario empiece a escribir
              }}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-options">
            <label className="checkbox-container">
              <input type="checkbox" disabled={isLoading} />
              <span className="checkmark"></span>
              Recordarme
            </label>
            <button type="button" className="forgot-password" disabled={isLoading}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>¿No tienes una cuenta? <button type="button" className="signup-link">Regístrate aquí</button></p>
        </div>
      </div>
    </div>
  );
};

export default Login; 