// src/utils/dateUtils.ts

/**
 * Utilidades para el manejo consistente de fechas en toda la aplicación
 */

/**
 * Convierte una cadena de fecha a un objeto Date ignorando ajustes de zona horaria
 * 
 * @param dateString Cadena de fecha en formato YYYY-MM-DD
 * @returns Objeto Date
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    // Extraer partes de la fecha (compatible con formato YYYY-MM-DD)
    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) return null;
    
    // Crear fecha con año, mes (0-indexed en JS) y día
    const date = new Date(
      parseInt(dateParts[0]), // Año
      parseInt(dateParts[1]) - 1, // Mes (0-indexed)
      parseInt(dateParts[2]) // Día
    );
    
    return date;
  } catch (error) {
    console.error('Error al parsear fecha:', error);
    return null;
  }
};

/**
 * Formatea una fecha para mostrar solo el día y mes (sin año)
 * 
 * @param date Objeto Date
 * @returns Cadena formateada (ej: "21 de septiembre")
 */
export const formatBirthday = (date: Date | null | undefined): string => {
  if (!date) return '';
  
  // Crear una nueva fecha sin componente de tiempo
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  return dateOnly.toLocaleDateString('es-GT', {
    day: 'numeric',
    month: 'long'
  });
};

/**
 * Calcula los días restantes hasta el próximo cumpleaños
 * 
 * @param birthDate Fecha de nacimiento (objeto Date o string en formato YYYY-MM-DD)
 * @returns Número de días hasta el próximo cumpleaños
 */
export const getDaysUntilBirthday = (birthDate: Date | string | null | undefined): number => {
  if (!birthDate) return Number.MAX_SAFE_INTEGER;
  
  // Convertir string a Date si es necesario
  const birthDateObj = typeof birthDate === 'string' ? parseDate(birthDate) : birthDate;
  if (!birthDateObj) return Number.MAX_SAFE_INTEGER;
  
  // Fecha actual sin componente de tiempo
  const today = new Date();
  const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Fecha del cumpleaños este año
  const birthdayThisYear = new Date(
    todayWithoutTime.getFullYear(),
    birthDateObj.getMonth(),
    birthDateObj.getDate()
  );
  
  // Si ya pasó, calcular para el próximo año
  if (birthdayThisYear < todayWithoutTime) {
    birthdayThisYear.setFullYear(todayWithoutTime.getFullYear() + 1);
  }
  
  // Calcular diferencia en días
  const diffTime = birthdayThisYear.getTime() - todayWithoutTime.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Formatea una fecha completa con día, mes y año
 * 
 * @param date Objeto Date o string en formato YYYY-MM-DD
 * @returns Cadena formateada (ej: "21 de septiembre de 2025")
 */
export const formatFullDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  // Convertir string a Date si es necesario
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return '';
  
  return dateObj.toLocaleDateString('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha con hora
 * 
 * @param dateTime Objeto Date o string en formato ISO
 * @returns Cadena formateada (ej: "21 de septiembre de 2025 a las 14:30")
 */
export const formatDateTime = (dateTime: Date | string | null | undefined): string => {
  if (!dateTime) return '';
  
  // Si es string, convertir directamente a Date
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  return dateObj.toLocaleString('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Verifica si dos fechas son el mismo día (ignora la hora)
 */
export const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false;
  
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Formatea el tiempo relativo (ej: "hace 2 horas", "hace 3 días")
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  
  // Convertir a diferentes unidades de tiempo
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 30) {
    // Para fechas más antiguas, mostrar el formato completo
    return formatDateTime(dateObj);
  } else if (diffDays > 0) {
    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  } else if (diffHours > 0) {
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffMins > 0) {
    return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  } else {
    return 'Hace un momento';
  }
};