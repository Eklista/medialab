// src/features/dashboard/pages/DashboardHome.tsx - 🎨 SORPRESA MOTIVACIONAL

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
  CalendarDaysIcon,
  FireIcon,
  LightBulbIcon,
  StarIcon,
  RocketLaunchIcon,
  SparklesIcon,
  HeartIcon,
  BoltIcon
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
  
  // 🎯 Mock data motivacional que puedes implementar en el futuro
  const [weeklyStreak] = useState(7); // Días consecutivos trabajando
  const [teamMood] = useState(85); // Porcentaje de satisfacción del equipo
  const [inspirationalQuote] = useState({
    text: "La creatividad es la inteligencia divirtiéndose.",
    author: "Albert Einstein"
  });
  
  // 🚀 Actividad reciente motivacional
  const [recentWins] = useState([
    {
      id: 1,
      title: "Podcast FACIMED alcanzó 1K reproducciones",
      time: "hace 2 horas",
      type: "milestone",
      icon: "🎉"
    },
    {
      id: 2,
      title: "Video institucional completado",
      time: "hace 4 horas", 
      type: "completion",
      icon: "✅"
    },
    {
      id: 3,
      title: "Nueva colaboración con FISICC",
      time: "ayer",
      type: "partnership",
      icon: "🤝"
    }
  ]);
  
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
  
  // 🎯 Estadísticas MOTIVACIONALES que puedes sacar de AuditLog + otros modelos
  const motivationalStats = [
    {
      title: "Racha de Productividad",
      value: `${weeklyStreak} días`,
      subtitle: "consecutivos creando",
      icon: <FireIcon className="h-6 w-6" />,
      gradient: "from-orange-400 to-red-500",
      textColor: "text-white",
      description: "¡Increíble constancia!"
    },
    {
      title: "Proyectos Completados",
      value: "23",
      subtitle: "este trimestre",
      icon: <RocketLaunchIcon className="h-6 w-6" />,
      gradient: "from-blue-400 to-purple-500",
      textColor: "text-white",
      description: "¡Superando metas!"
    },
    {
      title: "Horas de Creatividad",
      value: "184h",
      subtitle: "invertidas este mes",
      icon: <LightBulbIcon className="h-6 w-6" />,
      gradient: "from-yellow-400 to-orange-400",
      textColor: "text-white",
      description: "¡Pura innovación!"
    },
    {
      title: "Satisfacción del Equipo",
      value: `${teamMood}%`,
      subtitle: "nivel de felicidad",
      icon: <HeartIcon className="h-6 w-6" />,
      gradient: "from-pink-400 to-rose-500",
      textColor: "text-white",
      description: "¡Ambiente genial!"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 🔥 Estadísticas MOTIVACIONALES - Nuevo diseño súper atractivo */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <SparklesIcon className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-[var(--color-text-main)]">
              Tu Impacto Creativo
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {motivationalStats.map((stat, index) => (
              <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`${stat.textColor} opacity-90 text-sm font-medium mb-1`}>
                      {stat.title}
                    </div>
                    <div className={`${stat.textColor} text-3xl font-bold mb-1`}>
                      {stat.value}
                    </div>
                    <div className={`${stat.textColor} opacity-75 text-xs mb-2`}>
                      {stat.subtitle}
                    </div>
                    <div className={`${stat.textColor} opacity-90 text-xs font-medium`}>
                      {stat.description}
                    </div>
                  </div>
                  <div className={`${stat.textColor} p-2 rounded-lg bg-white bg-opacity-20`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🎯 Fila principal: Mini Calendario + Frase Inspiracional */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* 📅 Mini Calendario - SÚPER COMPACTO */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">
                {new Date().toLocaleDateString('es', { weekday: 'long' })}
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {new Date().getDate()}
              </div>
              <div className="text-lg font-medium text-gray-700 mb-4">
                {new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' })}
              </div>
              
              {/* Mini vista de eventos de hoy */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>Eventos de hoy</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Grabación FISICC - 10:00</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Podcast FACIMED - 14:30</span>
                  </div>
                </div>
                <button className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Ver calendario completo →
                </button>
              </div>
            </div>
          </div>

          {/* 💡 Frase Inspiracional + Mood del equipo */}
          <div className="space-y-6">
            {/* Frase del día */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10">
                <LightBulbIcon className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  Inspiración del Día
                </h3>
                <blockquote className="text-sm italic mb-3 leading-relaxed">
                  "{inspirationalQuote.text}"
                </blockquote>
                <cite className="text-xs opacity-75">— {inspirationalQuote.author}</cite>
              </div>
            </div>

            {/* Mood del equipo */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <HeartIcon className="h-5 w-5 text-pink-500" />
                  Energía del Equipo
                </h3>
                <span className="text-2xl">😊</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Satisfacción</span>
                  <span className="font-medium">{teamMood}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${teamMood}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600">
                ¡El equipo está súper motivado! 🚀
              </p>
            </div>
          </div>
        </div>

        {/* 🏆 Segunda fila: Colaborador del mes + Próximos cumpleaños */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* 🏆 Colaborador del mes - REDISEÑADO con más estilo */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header con gradiente dorado */}
            <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 p-6 relative">
              <div className="absolute top-0 right-0 opacity-20">
                <TrophyIcon className="h-16 w-16" />
              </div>
              <div className="flex items-center gap-3 text-white relative z-10">
                <TrophyIcon className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-semibold">Colaborador del Mes</h3>
                  <p className="text-sm opacity-90">Mayo 2025 • ¡Felicidades! 🎉</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center">
                <div className="relative">
                  <UserProfilePhoto size="xl" />
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full p-2 shadow-lg">
                    <StarIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-xl font-bold text-[var(--color-text-main)]">
                    John Doe
                  </h4>
                  <p className="text-[var(--color-text-secondary)] mb-2">Área de Transmisión</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="primary" size="sm">15 Proyectos</Badge>
                    <Badge variant="success" size="sm">98% Calidad</Badge>
                    <Badge variant="secondary" size="sm">Mentor</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-700">
                  "Su dedicación en el proyecto FISICC y su constante innovación lo convierten en un ejemplo para todo el equipo. ¡Gracias por elevar nuestros estándares!" ⭐
                </p>
              </div>
            </div>
          </div>

          {/* 🎂 Próximos cumpleaños - REDISEÑADO */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header con gradiente rosa */}
            <div className="bg-gradient-to-r from-pink-400 via-rose-500 to-purple-500 p-6 relative">
              <div className="absolute top-0 right-0 opacity-20">
                <CakeIcon className="h-16 w-16" />
              </div>
              <div className="flex items-center gap-3 text-white relative z-10">
                <CakeIcon className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-semibold">Próximos Cumpleaños</h3>
                  <p className="text-sm opacity-90">¡Celebremos juntos! 🎈</p>
                </div>
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
                  <p className="mb-2">No hay cumpleaños próximos</p>
                  <p className="text-xs">¡Pero siempre hay motivos para celebrar! 🎉</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBirthdays.map((user) => (
                    <div key={user.id} className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg hover:from-pink-100 hover:to-purple-100 transition-colors duration-200 border border-pink-100">
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
                          {user.daysUntilBirthday === 0 ? "¡Hoy! 🎉" : 
                           user.daysUntilBirthday === 1 ? "¡Mañana! 🎂" : 
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

        {/* 🚀 Tercera fila: Logros Recientes del Equipo */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BoltIcon className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Logros Recientes</h3>
            </div>
            <Badge variant="success" size="sm">¡En racha!</Badge>
          </div>
          
          <div className="space-y-3">
            {recentWins.map((win) => (
              <div key={win.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:from-green-100 hover:to-emerald-100 transition-colors duration-200">
                <div className="text-2xl">{win.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{win.title}</p>
                  <p className="text-xs text-gray-500">{win.time}</p>
                </div>
                <Badge variant="success" size="sm">Completado</Badge>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              🎯 <strong>¡Increíble trabajo en equipo!</strong> Sigamos construyendo el futuro del MediaLab juntos.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;