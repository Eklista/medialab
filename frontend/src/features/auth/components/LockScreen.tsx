// src/features/auth/components/LockScreen.tsx - OPTIMIZED VERSION
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../../../context/AppDataContext';
import TextInput from '../../service-request/components/TextInput';
import Button from '../../service-request/components/Button';
import UserProfilePhoto from '../../dashboard/components/ui/UserProfilePhoto';
import heroImage from '../../../assets/images/medialab-hero.jpg';

const LockScreen: React.FC = () => {
  const { state: authState, unlockSession, logout } = useAuth();
  const { user } = useAppData();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 🚀 OPTIMIZADO: Usar datos del AppDataContext primero
  const currentUser = user || authState.user;
  
  // 🚀 OPTIMIZADO: Memoizar adaptación del usuario
  const adaptedUser = useMemo(() => {
    if (!currentUser) return undefined;
    
    return {
      id: currentUser.id ? (typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id) : undefined,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      profileImage: (currentUser as any).profileImage || (currentUser as any).profile_image,
      profile_image: (currentUser as any).profileImage || (currentUser as any).profile_image
    };
  }, [currentUser]);
  
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await unlockSession(password);
      setPassword('');
    } catch (error) {
      console.error("Error al desbloquear:", error);
      setError('Contraseña incorrecta. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setPassword('');
    setError('');
    logout();
  };
  
  // 🚀 OPTIMIZADO: Early returns mejorados
  if (!currentUser) {
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
            onClick={() => {
              localStorage.clear();
              window.location.href = '/ml-admin/login';
            }}
          >
            Volver a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  if (authState.isLoggingOut) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cerrando sesión...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row">
      <div className="relative md:w-1/2 h-64 md:h-auto">
        <img 
          src={heroImage}
          alt="MediaLab"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex flex-col justify-center px-8 md:px-12">
          <div className="text-white space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              Bienvenido a <span className="text-[var(--color-accent-1)]">MediaLab</span>
            </h1>
            <p className="text-lg opacity-90">
              Departamento de producción audiovisual de Universidad Galileo
            </p>
          </div>
        </div>
      </div>
      
      <div className="md:w-1/2 flex flex-col">
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <UserProfilePhoto 
                  user={adaptedUser}
                  size="2xl"
                  className="border-4 border-white shadow-md"
                  clickable={false}
                  enableCache={true} // 🚀 NUEVO: Habilitar cache
                />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Sesión Bloqueada</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Hola, {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {currentUser?.email}
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
                disabled={isLoading}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                }
              />
              
              <div className="mt-6 flex flex-col space-y-4">
                <Button 
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || authState.isLoggingOut}
                >
                  Desbloquear
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={handleLogout}
                  disabled={isLoading || authState.isLoggingOut}
                >
                  {authState.isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
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