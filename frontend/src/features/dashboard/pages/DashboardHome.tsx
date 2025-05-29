// src/features/dashboard/pages/DashboardHome.tsx

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/ui/Badge';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';
import { useAuth } from '../../auth/hooks/useAuth';
import { userService } from '../../../services';
import { parseDate, formatBirthday, getDaysUntilBirthday } from '../utils/dateUtils';

// Iconos
import {
  TrophyIcon,
  CakeIcon,
  PlayIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon
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

interface ProjectItem {
  id: string;
  title: string;
  type: 'video' | 'podcast' | 'live' | 'course';
  progress: number;
  dueDate: string;
  status: 'active' | 'review' | 'completed';
  team: string[];
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

  // Cargar cumpleaños
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setIsLoadingBirthdays(true);
        const users = await userService.getUsers();
        
        const validBirthdayUsers = users
          .filter(user => user.birth_date)
          .map(user => {
            const birthDate = parseDate(user.birth_date!);
            if (!birthDate) return null;
            
            const daysUntilBirthday = getDaysUntilBirthday(birthDate);
            const name = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim();
            
            return {
              id: user.id,
              name: name,
              profileImage: user.profileImage || user.profile_image,
              birthDate: birthDate,
              daysUntilBirthday,
              initials: getInitials(name)
            };
          })
          .filter(Boolean)
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
  
  // Estadísticas principales con diseño moderno
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

  // Proyectos destacados
  const featuredProjects: ProjectItem[] = [
    {
      id: "proj-1",
      title: "Conferencia Anual de Innovación 2025",
      type: "live",
      progress: 85,
      dueDate: "2025-05-28",
      status: "active",
      team: ["Ana García", "Carlos López", "María Rodríguez"]
    },
    {
      id: "proj-2", 
      title: "Podcast: Historias de Éxito Galileo",
      type: "podcast",
      progress: 65,
      dueDate: "2025-05-30",
      status: "active",
      team: ["Juan Pérez", "Laura Martínez"]
    },
    {
      id: "proj-3",
      title: "Video Institucional - Nueva Sede",
      type: "video",
      progress: 100,
      dueDate: "2025-05-25",
      status: "completed",
      team: ["Roberto Silva", "Claudia Morales"]
    }
  ];

  const getProjectIcon = (type: ProjectItem['type']) => {
    switch (type) {
      case 'video': return <VideoCameraIcon className="h-5 w-5" />;
      case 'podcast': return <MicrophoneIcon className="h-5 w-5" />;
      case 'live': return <PlayIcon className="h-5 w-5" />;
      case 'course': return <ChartBarIcon className="h-5 w-5" />;
      default: return <ChartBarIcon className="h-5 w-5" />;
    }
  };

  const getProjectTypeColor = (type: ProjectItem['type']) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-700';
      case 'podcast': return 'bg-purple-100 text-purple-700';
      case 'live': return 'bg-red-100 text-red-700';
      case 'course': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'active': return <Badge variant="success">Activo</Badge>;
      case 'review': return <Badge variant="warning">En Revisión</Badge>;
      case 'completed': return <Badge variant="info">Completado</Badge>;
      default: return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Estadísticas principales */}
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

        {/* Segunda fila: Colaborador del mes y Próximos cumpleaños */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colaborador del mes */}
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
                    Pablito Lindo
                  </h4>
                  <p className="text-[var(--color-text-secondary)]">Área de Transmisión</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="primary">1 Produccion</Badge>
                    <Badge variant="success">5000 Transmisiones</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-700">
                  Es el mejor del mundo mundial.
                </p>
              </div>
            </div>
          </div>

          {/* Próximos cumpleaños */}
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
                          lastName: user.name.split(' ')[1],
                          profileImage: user.profileImage
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

        {/* Proyectos destacados */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-main)]">
              Proyectos Destacados
            </h2>
            <button className="text-sm font-medium text-[var(--color-accent-1)] hover:text-[var(--color-hover)] transition-colors self-start sm:self-center">
              Ver todos los proyectos →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all duration-200 hover:border-[var(--color-accent-1)]">
                <div className="p-6">
                  {/* HEADER DE PROYECTOS RESPONSIVE MEJORADO */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className={`p-2 rounded-lg ${getProjectTypeColor(project.type)} flex-shrink-0`}>
                      {getProjectIcon(project.type)}
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-[var(--color-text-main)] mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Progreso */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-secondary)]">Progreso</span>
                        <span className="font-medium text-[var(--color-text-main)]">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[var(--color-accent-1)] to-[var(--color-hover)] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Fecha de entrega */}
                    <div className="flex items-center text-sm text-[var(--color-text-secondary)]">
                      <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Entrega: {new Date(project.dueDate).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Equipo */}
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 text-[var(--color-text-secondary)] mr-2 flex-shrink-0" />
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white flex-shrink-0"
                            title={member}
                          >
                            {getInitials(member)}
                          </div>
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white flex-shrink-0">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;