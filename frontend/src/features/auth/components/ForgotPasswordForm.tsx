// src/features/auth/components/ForgotPasswordForm.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TextInput from '../../service-request/components/TextInput';
import Button from '../../service-request/components/Button';
import { useAuth } from '../hooks/useAuth';

const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword, state } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (error) {
      // Error ya manejado en el contexto
    }
  };
  
  if (submitted && !state.error) {
    return (
      <div className="text-center">
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-medium">¡Correo enviado!</p>
          <p>Hemos enviado instrucciones para recuperar tu contraseña.</p>
        </div>
        
        <p className="mb-6 text-sm text-gray-600">
          Revisa tu bandeja de entrada y sigue las instrucciones.
          Si no encuentras el correo, revisa tu carpeta de spam.
        </p>
        
        <div className="mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {state.error}
        </div>
      )}
      
      <div>
        <p className="mb-4 text-gray-600">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
        </p>
        
        <TextInput
          id="email"
          name="email"
          label="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="usuario@ejemplo.com"
          required
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
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
          Enviar instrucciones
        </Button>
        
        <Link to="/login" className="text-center py-2 text-blue-600 hover:underline sm:self-center">
          ← Volver
        </Link>
      </div>
      
      {/* Puedes decidir si mantener o eliminar estos ejemplos de correo también */}
      <div className="text-center text-sm text-gray-500 mt-2">
        <p>Para pruebas, usa estos correos:</p>
        <p>pablo@prueba.com o kohler@prueba.com</p>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;