// src/features/auth/components/ResetPasswordForm.tsx

import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TextInput from '../../service-request/components/TextInput';
import Button from '../../service-request/components/Button';
import { useAuth } from '../hooks/useAuth';

const ResetPasswordForm: React.FC = () => {
  const { resetPassword, state } = useAuth();
  const navigate = useNavigate();
  useParams<{ token?: string }>();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [success, setSuccess] = useState(false);
  
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
        
        <TextInput
          id="password"
          name="password"
          label="Nueva contraseña"
          value={formData.password}
          onChange={handleChange}
          type="password"
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
        
        <TextInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar contraseña"
          value={formData.confirmPassword}
          onChange={handleChange}
          type="password"
          placeholder="••••••••"
          required
          error={formErrors.confirmPassword}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          }
        />
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