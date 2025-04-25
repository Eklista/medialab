// src/features/auth/components/PasswordRecoveryForm.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextInput from '../../service-request/components/TextInput';
import Button from '../../service-request/components/Button';
import { useAuth } from '../hooks/useAuth';

// Definir tipos para los estados del formulario
type RecoveryStep = 'email' | 'token' | 'password' | 'success';

const PasswordRecoveryForm: React.FC = () => {
  const { forgotPassword, verifyCode, resetPassword, state } = useAuth();
  const navigate = useNavigate();
  
  // Estado para rastrear el paso actual
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('email');
  
  // Estados para los diferentes campos
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [tokenDigits, setTokenDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados para errores de formulario
  const [formErrors, setFormErrors] = useState({
    email: '',
    token: '',
    password: '',
    confirmPassword: ''
  });
  
  // Estados para indicar carga por paso
  const [isLoading, setIsLoading] = useState(false);
  
  // Temporizador para expiración del token
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutos en segundos
  const [timerActive, setTimerActive] = useState(false);
  
  // Efecto para el temporizador
  useEffect(() => {
    let interval: number;
    
    if (timerActive && timeRemaining > 0) {
      interval = window.setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // Token expirado
      setFormErrors(prev => ({
        ...prev,
        token: 'El código ha expirado. Por favor, solicita uno nuevo.'
      }));
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [timerActive, timeRemaining]);
  
  // Manejar cambio en los dígitos del token
  const handleTokenDigitChange = (index: number, value: string) => {
    if (value.length > 1) return; // Permitir solo un dígito
    if (!/^\d*$/.test(value)) return; // Permitir solo números
    
    const newTokenDigits = [...tokenDigits];
    newTokenDigits[index] = value;
    setTokenDigits(newTokenDigits);
    setToken(newTokenDigits.join(''));
    
    // Mover al siguiente input si se ingresó un dígito
    if (value && index < 5) {
      const nextInput = document.getElementById(`token-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    
    // Limpiar error
    if (formErrors.token) {
      setFormErrors(prev => ({ ...prev, token: '' }));
    }
  };
  
  // Manejar tecla de retroceso (backspace) en dígitos del token
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !tokenDigits[index] && index > 0) {
      // Si el campo actual está vacío y se presiona backspace, mover al campo anterior
      const prevInput = document.getElementById(`token-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };
  
  // Manejar pegado (paste) de token completo
  const handleTokenPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    
    if (digits.length > 0) {
      const newTokenDigits = [...tokenDigits];
      digits.forEach((digit, index) => {
        if (index < 6) newTokenDigits[index] = digit;
      });
      
      setTokenDigits(newTokenDigits);
      setToken(newTokenDigits.join(''));
      
      // Enfocar el último campo rellenado o el siguiente vacío
      const nextIndex = Math.min(digits.length, 5);
      const nextInput = document.getElementById(`token-${nextIndex}`);
      if (nextInput) nextInput.focus();
    }
  };
  
  // Validar contraseña
  const validatePassword = (): boolean => {
    let isValid = true;
    const errors = { ...formErrors };
    
    // Validar contraseña
    if (password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'La contraseña debe contener al menos una letra mayúscula';
      isValid = false;
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'La contraseña debe contener al menos una letra minúscula';
      isValid = false;
    } else if (!/\d/.test(password)) {
      errors.password = 'La contraseña debe contener al menos un número';
      isValid = false;
    }
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Calcular la fortaleza de la contraseña
  const getPasswordStrength = (): { percentage: number, text: string, color: string } => {
    if (password.length === 0) return { percentage: 0, text: '', color: 'bg-gray-200' };
    
    let strength = 0;
    
    // Criterios básicos
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    
    // Criterios adicionales para contraseñas más fuertes
    if (password.length >= 10) strength += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;
    
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
  
  // Manejar envío del formulario según el paso actual
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      switch (currentStep) {
        case 'email':
          if (!email.trim()) {
            setFormErrors(prev => ({ ...prev, email: 'El correo electrónico es requerido' }));
            break;
          }
          
          // Enviar solicitud de código al backend
          await forgotPassword(email);
          
          // Iniciar el temporizador para el token
          setTimeRemaining(300);
          setTimerActive(true);
          
          // Avanzar al siguiente paso
          setCurrentStep('token');
          break;
          
        case 'token':
          if (token.length !== 6) {
            setFormErrors(prev => ({ ...prev, token: 'El código debe tener 6 dígitos' }));
            break;
          }
          
          // Verificar el código con el backend
          try {
            const isValid = await verifyCode(email, token);
            if (isValid) {
              setCurrentStep('password');
            } else {
              setFormErrors(prev => ({ ...prev, token: 'Código inválido. Inténtalo de nuevo.' }));
            }
          } catch (error) {
            setFormErrors(prev => ({ ...prev, token: 'Código inválido o expirado. Inténtalo de nuevo.' }));
          }
          break;
          
        case 'password':
          if (!validatePassword()) {
            break;
          }
          
          // Enviar solicitud de restablecimiento de contraseña
          await resetPassword(password, confirmPassword, token, email);
          
          // Avanzar al paso de éxito
          setCurrentStep('success');
          
          // Redirigir después de unos segundos
          setTimeout(() => {
            navigate('/login');
          }, 5000);
          break;
      }
    } catch (error) {
      console.error('Error en el proceso de recuperación:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatear tiempo restante
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Función para volver al paso anterior
  const goBack = () => {
    if (currentStep === 'token') {
      setCurrentStep('email');
      setTimerActive(false);
    } else if (currentStep === 'password') {
      setCurrentStep('token');
    }
  };
  
  // Función para reenviar el código
  const resendCode = async () => {
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setTimeRemaining(300);
      setTimerActive(true);
      setFormErrors(prev => ({ ...prev, token: '' }));
      setTokenDigits(['', '', '', '', '', '']);
      setToken('');
    } catch (error) {
      console.error('Error al reenviar el código:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const passwordStrength = getPasswordStrength();
  
  // Renderizar el paso actual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'email':
        return (
          <>
            <div className="mb-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <h3 className="text-sm font-medium text-blue-800">Paso 1 de 3: Verificación de correo</h3>
              </div>
              <p className="text-sm text-blue-700">
                Enviaremos un código de 6 dígitos a tu correo electrónico para verificar tu identidad.
              </p>
            </div>
            
            <div className="mb-6">
              <TextInput
                id="email"
                name="email"
                label="Correo Electrónico"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                }}
                type="email"
                placeholder="usuario@ejemplo.com"
                required
                error={formErrors.email}
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
                loading={isLoading || state.isLoading}
                fullWidth
              >
                Enviar código de verificación
              </Button>
              
              <Link to="/login" className="text-center py-2 text-blue-600 hover:underline sm:self-center">
                ← Volver al inicio
              </Link>
            </div>
            
            {/* Ejemplos de correo para pruebas */}
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Para pruebas, usa estos correos:</p>
              <p>pablo@prueba.com o kohler@prueba.com</p>
            </div>
          </>
        );
        
      case 'token':
        return (
          <>
            <div className="mb-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <h3 className="text-sm font-medium text-blue-800">Paso 2 de 3: Ingresa el código</h3>
              </div>
              <p className="text-sm text-blue-700">
                Hemos enviado un código de verificación a <span className="font-semibold">{email}</span>.
              </p>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de verificación
              </label>
              
              <div className="flex justify-center space-x-2 mb-1">
                {tokenDigits.map((digit, index) => (
                  <input
                    key={`token-${index}`}
                    id={`token-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleTokenDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handleTokenPaste : undefined}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                ))}
              </div>
              
              {formErrors.token && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.token}
                </p>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                  Tiempo restante: <span className={timeRemaining < 60 ? "text-red-600 font-medium" : "font-medium"}>{formatTimeRemaining()}</span>
                </p>
                
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={isLoading || timeRemaining > 270} // Permitir reenvío después de 30 segundos
                  className={`text-sm font-medium ${isLoading || timeRemaining > 270 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-500'}`}
                >
                  Reenviar código
                </button>
              </div>
              
              {timeRemaining > 270 && (
                <p className="text-xs text-gray-500 mt-1">
                  Podrás solicitar un nuevo código en {Math.ceil((timeRemaining - 270) / 60)} minutos
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit"
                variant="primary"
                loading={isLoading || state.isLoading}
                fullWidth
              >
                Verificar código
              </Button>
              
              <button
                type="button"
                onClick={goBack}
                className="text-center py-2 text-blue-600 hover:underline sm:self-center"
              >
                ← Volver al paso anterior
              </button>
            </div>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Para fines de prueba, usa el código: 123456</p>
            </div>
          </>
        );
        
      case 'password':
        return (
          <>
            <div className="mb-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <h3 className="text-sm font-medium text-blue-800">Paso 3 de 3: Nueva contraseña</h3>
              </div>
              <p className="text-sm text-blue-700">
                Crea una nueva contraseña segura para tu cuenta.
              </p>
            </div>
            
            <div className="relative mb-6">
              <TextInput
                id="password"
                name="password"
                label="Nueva contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                }}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Indicador de fortaleza */}
            {password && (
              <div className="mb-6">
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
            
            <div className="relative mb-6">
              <TextInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit"
                variant="primary"
                loading={isLoading || state.isLoading}
                fullWidth
              >
                Restablecer contraseña
              </Button>
              
              <button
                type="button"
                onClick={goBack}
                className="text-center py-2 text-blue-600 hover:underline sm:self-center"
              >
                ← Volver al paso anterior
              </button>
            </div>
          </>
        );
        
      case 'success':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Contraseña restablecida!</h3>
            
            <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-green-700">
                Tu contraseña ha sido actualizada correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            
            <p className="mb-6 text-gray-600">
              Serás redirigido a la página de inicio de sesión en unos segundos...
            </p>
            
            <div className="mt-4">
              <Link 
                to="/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          </div>
        );
    }
  };
  
  // Renderizar el indicador de progreso
  const renderProgressIndicator = () => {
    // Solo mostrar en los pasos del proceso, no en la pantalla de éxito
    if (currentStep === 'success') return null;
    
    const steps = [
      { id: 'email', name: 'Correo', status: currentStep === 'email' ? 'current' : (currentStep === 'token' || currentStep === 'password') ? 'complete' : 'upcoming' },
      { id: 'token', name: 'Verificación', status: currentStep === 'token' ? 'current' : currentStep === 'password' ? 'complete' : 'upcoming' },
      { id: 'password', name: 'Contraseña', status: currentStep === 'password' ? 'current' : 'upcoming' },
    ];
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, stepIdx) => (
            <div key={step.id} className="flex items-center relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'complete' ? 'bg-blue-600' : 
                  step.status === 'current' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                {step.status === 'complete' ? (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-sm font-medium ${step.status === 'current' ? 'text-white' : 'text-gray-500'}`}>
                    {stepIdx + 1}
                  </span>
                )}
              </div>
              <div className="ml-2">
                <p className={`text-xs font-medium ${
                  step.status === 'complete' ? 'text-blue-600' : 
                  step.status === 'current' ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
              </div>
              
              {stepIdx < steps.length - 1 && (
                <div className="hidden sm:block w-16 absolute left-10 top-4 -mt-0.5 border-t border-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {state.error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {state.error}
        </div>
      )}
      
      {renderProgressIndicator()}
      
      <form onSubmit={handleSubmit}>
        {renderCurrentStep()}
      </form>
    </div>
  );
};

export default PasswordRecoveryForm;