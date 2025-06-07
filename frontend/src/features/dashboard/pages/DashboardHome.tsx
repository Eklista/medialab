// src/features/dashboard/pages/DashboardHome.tsx - 🎨 DISEÑO ORIGINAL CON CALENDARIO

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/ui/Badge';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';
import Calendar from '../components/ui/Calendar';
import { useAuth } from '../../auth/hooks/useAuth';
import { userService } from '../../../services';
import { parseDate, formatBirthday, getDaysUntilBirthday } from '../utils/dateUtils';

// Iconos
import {
  TrophyIcon,
  CakeIcon,
  CalendarDaysIcon,
  PlayIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Interfaces
interface BirthdayUser {
  id: number;
  name: string;
  profileImage?: string;
  birthDate: Date;
  daysUntilBirthday: number;
  initials: string;
}

const DashboardHome: React.FC = () => {
  useAuth();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayUser[]>([]);
  const [isLoadingBirthdays, setIsLoadingBirthdays] = useState(true);
  
  // Función para generar iniciales
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Cargar cumpleaños usando el nuevo service stack
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setIsLoadingBirthdays(true);
        
        // 🆕 USANDO NUEVO STACK DE SERVICES
        const users = await userService.list.getUsersFormatted({ 
          limit: 100,
          formatType: 'with_roles'
        });
        
        const validBirthdayUsers = users
          .filter(user => user.birth_date)
          .map(user => {
            const birthDate = parseDate(user.birth_date!);
            if (!birthDate) return null;
          
            const daysUntilBirthday = getDaysUntilBirthday(birthDate);
            
            // 🔧 SOLUCIÓN ROBUSTA: Usar el fullName del nuevo stack
            const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            const profileImage = user.profileImage || null;
          
            return {
              id: user.id,
              name: name,
              profileImage: profileImage,
              birthDate: birthDate,
              daysUntilBirthday,
              initials: user.initials || getInitials(name)
            };
          })
          .filter(user => user !== null)
          .sort((a, b) => a!.daysUntilBirthday - b!.daysUntilBirthday)
          .slice(0, 3) as BirthdayUser[];
        
        setUpcomingBirthdays(validBirthdayUsers);
      } catch (error) {
        console.error('Error al cargar cumpleaños:', error);
      } finally {
        setIsLoadingBirthdays(false);
      }
    };
    
    fetchBirthdays();
  }, []);
  
  // 🎯 Estadísticas principales con diseño moderno ORIGINAL
  const mainStats = [
    {
      title: "Proyectos Activos",
      value: "24",
      icon: <PlayIcon className="h-6 w-6" />,
      change: { value: 12, isPositive: true },
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Producciones Completadas",
      value: "156",
      icon: <VideoCameraIcon className="h-6 w-6" />,
      change: { value: 8, isPositive: true },
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Podcasts Publicados",
      value: "42",
      icon: <MicrophoneIcon className="h-6 w-6" />,
      change: { value: 3, isPositive: true },
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Horas de Contenido",
      value: "1,284",
      icon: <ChartBarIcon className="h-6 w-6" />,
      change: { value: 156, isPositive: true },
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
      iconColor: "text-amber-600"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 📊 Estadísticas principales - DISEÑO ORIGINAL */}
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-main)] mb-6">
            Resumen General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainStats.map((stat, index) => (
              <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-white shadow-sm hover:shadow-md transition-shadow duration-200`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-[var(--color-text-main)] mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${stat.change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change.isPositive ? '+' : '-'}{stat.change.value}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">este mes</span>
                    </div>
                  </div>
                  <div className={`${stat.iconColor} p-3 rounded-xl bg-white shadow-sm`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🎯 Primera fila: Colaborador del mes y Cumpleaños */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 🏆 Colaborador del mes - DISEÑO ORIGINAL COMPLETO */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 relative">
            {/* PIN ICON - TROPHY */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full p-2 shadow-md">
                <TrophyIcon className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="p-6 border-b border-[var(--color-border)]">
              <div className="pr-12">
                <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                  Colaborador del Mes
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Mejor desempeño en mayo 2025
                </p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center">
                <div className="relative">
                  <UserProfilePhoto size="xl" />
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full p-2">
                    <TrophyIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-xl font-bold text-[var(--color-text-main)]">
                    John Doe
                  </h4>
                  <p className="text-[var(--color-text-secondary)]">Área de Transmisión</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="primary">1 Producción</Badge>
                    <Badge variant="success">5000 Transmisiones</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-700">
                  ¡Felicidades por tu dedicación y esfuerzo! Tu compromiso inspira a todo el equipo y nos motiva a seguir creciendo juntos. ¡Gracias por ser un ejemplo de excelencia!
                </p>
              </div>
            </div>
          </div>

          {/* 🎂 Próximos cumpleaños - DISEÑO ORIGINAL COMPLETO */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 relative">
            {/* PIN ICON - CAKE */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-gradient-to-r from-pink-400 to-pink-500 rounded-full p-2 shadow-md">
                <CakeIcon className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="p-6 border-b border-[var(--color-border)]">
              <div className="pr-12">
                <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                  Próximos Cumpleaños
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Celebremos juntos estos momentos especiales
                </p>
              </div>
            </div>

            <div className="p-6">
              {isLoadingBirthdays ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-accent-1)]"></div>
                </div>
              ) : upcomingBirthdays.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <CakeIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay cumpleaños próximos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBirthdays.map((user) => (
                    <div key={user.id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <UserProfilePhoto 
                        user={{
                          firstName: user.name.split(' ')[0],
                          lastName: user.name.split(' ')[1] || '',
                          profileImage: user.profileImage,
                          initials: user.initials
                        }}
                        size="lg"
                      />
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="font-medium text-[var(--color-text-main)] truncate">
                          {user.name}
                        </p>
                        <div className="flex items-center text-sm text-[var(--color-text-secondary)] mt-1">
                          <CalendarDaysIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{formatBirthday(user.birthDate)}</span>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <Badge 
                          variant={
                            user.daysUntilBirthday === 0 ? "success" :
                            user.daysUntilBirthday <= 7 ? "warning" : "info"
                          }
                        >
                          {user.daysUntilBirthday === 0 ? "¡Hoy!" : 
                           user.daysUntilBirthday === 1 ? "¡Mañana!" : 
                           `En ${user.daysUntilBirthday} días`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📅 Nueva sección: Calendario compacto */}
        <div>
          <Calendar compact className="w-full" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;