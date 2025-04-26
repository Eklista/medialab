// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// Función para mantener la sesión activa
const setupSessionHandling = () => {
  // Detectar cuando la página se recarga o se cierra
  window.addEventListener('beforeunload', () => {
    // Guardar timestamp del último cierre/recarga
    localStorage.setItem('lastPageExit', Date.now().toString());
  });
  
  // Al cargar la página, verificar cuánto tiempo pasó desde el último cierre
  const lastPageExit = localStorage.getItem('lastPageExit');
  if (lastPageExit) {
    const timeSinceLastExit = Date.now() - parseInt(lastPageExit);
    
    // Si pasó mucho tiempo (por ejemplo, más de 30 minutos), podemos considerar bloquear la sesión
    const maxInactivityTime = 30 * 60 * 1000; // 30 minutos
    if (timeSinceLastExit > maxInactivityTime) {
      // Marcar la sesión como bloqueada si el usuario estaba autenticado
      if (localStorage.getItem('accessToken')) {
        localStorage.setItem('sessionLocked', 'true');
      }
    }
  }
};

// Configurar manejo de sesión
setupSessionHandling();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)