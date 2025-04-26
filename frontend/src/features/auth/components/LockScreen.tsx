// src/features/auth/components/LockScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import TextInput from '../../service-request/components/TextInput';
import Button from '../../service-request/components/Button';
import heroImage from '../../../assets/images/medialab-hero.jpg';
import defaultUserImage from '../../../assets/images/user.jpg';


const LockScreen: React.FC = () => {
  const { state, unlockSession } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Bloquear scroll del body cuando el LockScreen está activo
  useEffect(() => {
    // Guardar el overflow original
    const originalOverflow = document.body.style.overflow;
    
    // Bloquear scroll
    document.body.style.overflow = 'hidden';
    
    // Restaurar overflow original al desmontar
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const getProfileImageUrl = () => {
    if (!state.user) return defaultUserImage;
    
    const profileImage = state.user.profileImage || state.user.profile_image;
    if (!profileImage) return defaultUserImage;
    
    // Si la URL ya es completa, usarla directamente
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    }
    
    // Determinar la URL base basada en el entorno
    const baseUrl = window.location.origin; // Usar el origen del navegador directamente
    
    // Asegurar que la ruta comience con /
    const path = profileImage.startsWith('/') ? profileImage : `/${profileImage}`;
    
    return `${baseUrl}${path}`;
  };
  
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await unlockSession(password);
      setPassword(''); // Limpiar contraseña después de un desbloqueo exitoso
    } catch (error) {
      console.error("Error al desbloquear:", error);
      setError('Contraseña incorrecta. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Si no hay usuario, mostrar mensaje de error
  if (!state.user) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="mb-4 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Error de sesión</h2>
          <p className="mb-4">No se ha podido recuperar la información del usuario.</p>
          <Button 
            variant="primary"
            onClick={() => window.location.href = '/login'}
          >
            Volver a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row">
      {/* Imagen lateral (izquierda en desktop, arriba en móvil) */}
      <div className="relative md:w-1/2 h-64 md:h-auto">
        <img 
          src={heroImage}
          alt="MediaLab"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex flex-col justify-center px-8 md:px-12">
          <div className="text-white space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              Bienvenido a <span className="text-(--color-accent-1)">MediaLab</span>
            </h1>
            <p className="text-lg opacity-90">
              Departamento de producción audiovisual de Universidad Galileo
            </p>
          </div>
        </div>
      </div>
      
      {/* Contenido del formulario (derecha en desktop, abajo en móvil) */}
      <div className="md:w-1/2 flex flex-col">
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              {/* Avatar del usuario con imagen de perfil */}
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 mb-4 overflow-hidden border-4 border-white shadow-md">
                {state.user && (state.user.profileImage || state.user.profile_image) ? (
                  <img 
                  src={getProfileImageUrl()} 
                  alt={state.user.firstName} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.error('Error al cargar la imagen de perfil:', e);
                    (e.target as HTMLImageElement).src = defaultUserImage;
                  }}
                />
                ) : (
                  <span className="text-xl font-bold">
                    {state.user?.firstName?.charAt(0)}{state.user?.lastName?.charAt(0)}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-(--color-text-main)">Sesión Bloqueada</h2>
              <p className="mt-2 text-sm text-(--color-text-secondary)">
                Hola, {state.user?.firstName} {state.user?.lastName}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {state.user?.email}
              </p>
            </div>
            
            <form onSubmit={handleUnlock}>
              <p className="text-center mb-6 text-gray-600">
                La sesión ha sido bloqueada por inactividad.
                <br />Ingresa tu contraseña para continuar.
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}
              
              <TextInput
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z" clipRule="evenodd" />
                  </svg>
                }
              />
              
              <div className="mt-6 flex flex-col space-y-4">
                <Button 
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                >
                  Desbloquear
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    // Cerrar sesión completamente si el usuario lo desea
                    window.location.href = '/login';
                  }}
                >
                  Cerrar sesión
                </Button>
              </div>
            </form>
          </div>
        </div>
        <div className="py-4 px-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MediaLab - Universidad Galileo
        </div>
      </div>
    </div>
  );
};

export default LockScreen;