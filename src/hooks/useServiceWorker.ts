import { useEffect } from 'react';
import { register } from '../serviceWorkerRegistration';

export const useServiceWorker = () => {
  useEffect(() => {
    register({
      onSuccess: (registration) => {
        console.log('Service Worker registrado exitosamente:', registration);
      },
      onUpdate: (registration) => {
        console.log('Nueva versión disponible:', registration);
        // Aquí podrías mostrar una notificación al usuario
        if (window.confirm('Hay una nueva versión disponible. ¿Deseas actualizar?')) {
          window.location.reload();
        }
      },
    });
  }, []);
}; 