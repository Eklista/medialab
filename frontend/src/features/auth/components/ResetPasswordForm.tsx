// src/features/auth/components/ResetPasswordForm.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextInput from '../../service-request/components/TextInput';
import Button from '../../service-request/components/Button';
import { useAuth } from '../hooks/useAuth';

const ResetPasswordForm: React.FC = () => {
  const { resetPassword, state } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [success, setSuccess] = useState(false);
  // Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al cambiar
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const validateForm = (): boolean => {
    let isValid = true;
    const errors = { password: '', confirmPassword: '' };
    
    // Validar contraseña
    if (formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
      isValid = false;
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'La contraseña debe contener al menos una letra mayúscula';
      isValid = false;
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = 'La contraseña debe contener al menos una letra minúscula';
      isValid = false;
    } else if (!/\d/.test(formData.password)) {
      errors.password = 'La contraseña debe contener al menos un número';
      isValid = false;
    }
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await resetPassword(formData.password, formData.confirmPassword);
      setSuccess(true);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      // Error ya manejado en el contexto
    }
  };
  
  // Calcular la fortaleza de la contraseña
  const getPasswordStrength = (): { percentage: number, text: string, color: string } => {
    if (formData.password.length === 0) return { percentage: 0, text: '', color: 'bg-gray-200' };
    
    let strength = 0;
    
    // Criterios básicos
    if (formData.password.length >= 8) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[a-z]/.test(formData.password)) strength += 25;
    if (/\d/.test(formData.password)) strength += 25;
    
    // Criterios adicionales para contraseñas más fuertes
    if (formData.password.length >= 10) strength += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) strength += 15;
    
    // Máximo 100%
    strength = Math.min(100, strength);
    
    let text, color;
    if (strength < 50) {
      text = 'Débil';
      color = 'bg-red-500';
    } else if (strength < 75) {
      text = 'Media';
      color = 'bg-yellow-500';
    } else {
      text = 'Fuerte';
      color = 'bg-green-500';
    }
    
    return { percentage: strength, text, color };
  };
  
  const passwordStrength = getPasswordStrength();
  
  // Mostrar pantalla de éxito
  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-medium">¡Contraseña restablecida con éxito!</p>
          <p>Tu contraseña ha sido actualizada correctamente.</p>
        </div>
        
        <p className="mb-4 text-gray-600">
          Serás redirigido a la página de inicio de sesión en unos segundos...
        </p>
        
        <Link 
          to="/login" 
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }
  
  // Formulario para restablecer contraseña
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {state.error}
        </div>
      )}
      
      <div>
        <p className="mb-4 text-gray-600">
          Crea una nueva contraseña para tu cuenta.
        </p>
        
        <div className="relative mb-4">
          <TextInput
            id="password"
            name="password"
            label="Nueva contraseña"
            value={formData.password}
            onChange={handleChange}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            required
            error={formErrors.password}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            }
            helperText="Mínimo 8 caracteres, incluyendo mayúsculas, minúsculas y números"
          />
          
          {/* Botón mostrar/ocultar contraseña */}
          <button
            type="button"
            className="absolute right-2 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              // Icono "Ocultar"
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            ) : (
              // Icono "Mostrar"
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Indicador de fortaleza */}
        {formData.password && (
          <div className="mt-2 mb-4">
            <div className="flex items-center mb-1">
              <span className="text-sm text-gray-600 mr-2">Fortaleza:</span>
              <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.percentage}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {passwordStrength.text}{' '}
              {passwordStrength.percentage < 100 ? '- Mejora tu contraseña para mayor seguridad' : '- Excelente contraseña'}
            </p>
          </div>
        )}
        
        <div className="relative">
          <TextInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            required
            error={formErrors.confirmPassword}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            }
          />
          
          {/* Botón mostrar/ocultar confirmar contraseña */}
          <button
            type="button"
            className="absolute right-2 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              // Icono "Ocultar"
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            ) : (
              // Icono "Mostrar"
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          type="submit"
          variant="primary"
          loading={state.isLoading}
          fullWidth
        >
          Restablecer contraseña
        </Button>
        
        <Link to="/login" className="text-center py-2 text-blue-600 hover:underline sm:self-center">
          ← Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
};

export default ResetPasswordForm;