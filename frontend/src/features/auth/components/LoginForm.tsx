// src/features/auth/components/LoginForm.tsx - OPTIMIZED VERSION
import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TextInput from '../../service-request/components/TextInput';
import Button from '../../service-request/components/Button';
import { useAuth } from '../hooks/useAuth';

const LoginForm: React.FC = () => {
  const { login, state: authState } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  
  // 🚀 OPTIMIZADO: Memoizar el handler para evitar re-renders innecesarios
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);
  
  // 🚀 OPTIMIZADO: Memoizar toggle
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  
  // 🚀 OPTIMIZADO: Memoizar submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });
    } catch (error) {
      console.error("Error en inicio de sesión:", error);
    }
  }, [login, formData]);
  
  // 🚀 OPTIMIZADO: Memoizar iconos para evitar re-renders
  const emailIcon = useMemo(() => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  ), []);
  
  const lockIcon = useMemo(() => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  ), []);
  
  const eyeIcon = useMemo(() => showPassword ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  ), [showPassword]);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {authState.error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {authState.error}
        </div>
      )}
      
      <TextInput
        id="email"
        name="email"
        label="Correo Electrónico"
        value={formData.email}
        onChange={handleChange}
        type="email"
        placeholder="usuario@ejemplo.com"
        required
        icon={emailIcon}
      />
      
      <div className="relative">
        <TextInput
          id="password"
          name="password"
          label="Contraseña"
          value={formData.password}
          onChange={handleChange}
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          required
          icon={lockIcon}
        />
        
        <button
          type="button"
          className="absolute right-2 top-9 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {eyeIcon}
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-black border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-600">
            Recordarme
          </label>
        </div>
        
        <div className="text-sm">
          <Link 
            to="/password-recovery" 
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
      
      <div>
        <Button 
          type="submit"
          variant="primary"
          fullWidth
          loading={authState.isLoading}
          disabled={authState.isLoading}
        >
          Iniciar Sesión
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;