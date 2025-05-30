// frontend/src/features/dashboard/pages/DashboardHome.tsx - 🚀 REESTRUCTURADO Y CORREGIDO
// Solo mantiene tarjetas de Colaborador del Mes y Cumpleaños

import React, { useMemo } from 'react';
import { 
  CalendarDaysIcon,
  GiftIcon, 
  TrophyIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

// 🔧 IMPORTS CORREGIDOS - usando nueva arquitectura
import { useAuth } from '../../auth/hooks/useAuth';
import { useAppData } from '../../../context/AppDataContext';
import { UserProfile } from '../../../services/users/types/user.types';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';

// ===== INTERFACES =====
interface BirthdayUser {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  fullName: string;        // ✅ Required string
  roles: string[];         // ✅ Required array
  isActive: boolean;       // ✅ Required boolean
  profileImage: string | null;
  birthDate: Date;
  daysUntilBirthday: number;
  initials: string;
}

interface EmployeeOfMonth {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  fullName: string;        // ✅ Required string
  roles: string[];         // ✅ Required array
  isActive: boolean;       // ✅ Required boolean
  profileImage: string | null;
  initials: string;
  achievements?: string[];
}

// ===== UTILIDADES =====
const parseDate = (dateString: string): Date | null => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const getDaysUntilBirthday = (birthDate: Date): number => {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
  
  if (nextBirthday < today) {
    nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Función para determinar empleado del mes (ejemplo de lógica)
const getEmployeeOfMonth = (users: UserProfile[]): EmployeeOfMonth | null => {
  if (users.length === 0) return null;
  
  // 🎯 LÓGICA SIMPLE: Por ahora seleccionar el primer usuario activo
  // TODO: Implementar lógica real basada en métricas de rendimiento
  const employee = users.find(user => user.isActive) || users[0];
  
  if (!employee) return null;
  
  const firstName = employee.firstName || '';
  const lastName = employee.lastName || '';
  const email = employee.email || '';
  const name = `${firstName} ${lastName}`.trim() || email;
  
  return {
    id: employee.id,
    name,
    firstName,
    lastName,
    email,
    username: employee.username || email,
    fullName: name,
    roles: [],
    isActive: employee.isActive ?? true, // ✅ Fallback a true si es undefined
    profileImage: employee.profileImage || null,
    initials: getInitials(name),
    achievements: [
      'Excelente trabajo en equipo',
      'Entrega de proyectos a tiempo',
      'Liderazgo destacado'
    ]
  };
};

// ===== COMPONENTE PRINCIPAL =====
const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const { users, isLoading } = useAppData();

  // ===== 🔧 CUMPLEAÑOS CORREGIDOS =====
  const upcomingBirthdays = useMemo((): BirthdayUser[] => {
    if (!users || users.length === 0) return [];

    const validBirthdayUsers: BirthdayUser[] = [];
    
    for (const user of users) {
      if (!user.birth_date) continue;
      
      const birthDate = parseDate(user.birth_date);
      if (!birthDate) continue;
     
      const daysUntilBirthday = getDaysUntilBirthday(birthDate);
      
      // 🔧 CORRECCIÓN: Asegurar que todos los campos requeridos estén presentes
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const email = user.email || '';
      const name = `${firstName} ${lastName}`.trim() || email;
     
      const birthdayUser: BirthdayUser = {
        id: user.id,
        name,
        firstName,
        lastName,
        email,
        username: user.username || email,
        fullName: name,
        roles: [],
        isActive: user.isActive ?? true, // ✅ Fallback a true si es undefined
        profileImage: user.profileImage || null,
        birthDate,
        daysUntilBirthday,
        initials: getInitials(name)
      };
      
      validBirthdayUsers.push(birthdayUser);
    }

    // Ordenar y retornar los primeros 3
    return validBirthdayUsers
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)
      .slice(0, 3);
  }, [users]);

  // ===== 🔧 EMPLEADO DEL MES =====
  const employeeOfMonth = useMemo((): EmployeeOfMonth | null => {
    if (!users || users.length === 0) return null;
    return getEmployeeOfMonth(users);
  }, [users]);

  // ===== ESTADOS DE CARGA =====
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">
            ¡Bienvenido de vuelta, {user?.firstName || user?.email || 'Usuario'}! 👋
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Aquí tienes un resumen de lo que está pasando en el equipo
          </p>
        </div>

        {/* Grid principal - Solo 2 tarjetas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 🏆 TARJETA COLABORADOR DEL MES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrophyIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                  Colaborador del Mes
                </h3>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>

            {employeeOfMonth ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <UserProfilePhoto
                    user={employeeOfMonth}
                    size="lg"
                    className="ring-2 ring-yellow-200"
                  />
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-main)]">
                      {employeeOfMonth.name}
                    </h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      🎉 ¡Felicitaciones por tu excelente trabajo!
                    </p>
                  </div>
                </div>
                
                {employeeOfMonth.achievements && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Logros destacados:</p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {employeeOfMonth.achievements.slice(0, 3).map((achievement, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrophyIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-[var(--color-text-secondary)]">
                  No hay datos de colaborador del mes disponibles
                </p>
              </div>
            )}
          </div>

          {/* 🎂 TARJETA PRÓXIMOS CUMPLEAÑOS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <GiftIcon className="h-5 w-5 text-pink-600" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                  Próximos Cumpleaños
                </h3>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>

            {upcomingBirthdays.length > 0 ? (
              <div className="space-y-3">
                {upcomingBirthdays.map((birthday) => (
                  <div key={birthday.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserProfilePhoto
                        user={birthday}
                        size="sm"
                        className="ring-2 ring-pink-200"
                      />
                      <div>
                        <p className="font-medium text-[var(--color-text-main)]">
                          {birthday.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {birthday.birthDate.toLocaleDateString('es-GT', { 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                        {birthday.daysUntilBirthday === 0 
                          ? '¡Hoy!' 
                          : birthday.daysUntilBirthday === 1 
                          ? '¡Mañana!' 
                          : `${birthday.daysUntilBirthday} días`
                        }
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium">
                    Ver todos los cumpleaños →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-[var(--color-text-secondary)]">
                  No hay cumpleaños próximos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Los cumpleaños aparecerán aquí cuando se acerquen
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer informativo */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Dashboard simplificado - Mostrando solo información esencial del equipo
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;