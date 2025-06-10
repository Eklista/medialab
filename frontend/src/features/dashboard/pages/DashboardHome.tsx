// src/features/dashboard/pages/DashboardHome.tsx - 🎨 CON CHARTS AUDIOVISUALES

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';
import Calendar from '../components/ui/Calendar';
import { useAuth } from '../../auth/hooks/useAuth';
import { userService } from '../../../services';
import { parseDate, formatBirthday, getDaysUntilBirthday } from '../utils/dateUtils';

// Apple Emojis
import { EmojiProvider, Emoji } from 'react-apple-emojis';
import emojiData from 'react-apple-emojis/src/data.json';

// Iconos heroicons
import {
  TrophyIcon,
  CakeIcon,
  CalendarDaysIcon,
  FireIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

// Charts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Interfaces
interface BirthdayUser {
  id: number;
  name: string;
  profileImage?: string;
  birthDate: Date;
  daysUntilBirthday: number;
  initials: string;
}

// Mock data para charts
const mockVideoViews = [
  { date: '01 Jun', videos: 1200, lives: 340, contenido: 850 },
  { date: '02 Jun', videos: 1850, lives: 420, contenido: 1100 },
  { date: '03 Jun', videos: 1600, lives: 380, contenido: 950 },
  { date: '04 Jun', videos: 2200, lives: 520, contenido: 1400 },
  { date: '05 Jun', videos: 2800, lives: 680, contenido: 1800 },
  { date: '06 Jun', videos: 2400, lives: 580, contenido: 1500 },
  { date: '07 Jun', videos: 3200, lives: 750, contenido: 2100 }
];

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-zinc-200">
        <p className="font-bold text-zinc-900 mb-2 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-zinc-700">
              {entry.name}: {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardHome: React.FC = () => {
  useAuth();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayUser[]>([]);
  const [isLoadingBirthdays, setIsLoadingBirthdays] = useState(true);
  
  // 🎯 Mock data motivacional
  const [weeklyStreak] = useState(7);
  const [inspirationalQuote] = useState({
    text: "La creatividad es la inteligencia divirtiéndose.",
    author: "Albert Einstein"
  });
  
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
  
  // 🎯 Estadísticas con colores lime/amarillo sobre fondo blanco
  const motivationalStats = [
    {
      title: "Racha de Productividad",
      value: `${weeklyStreak} días`,
      subtitle: "consecutivos creando",
      icon: <FireIcon className="h-6 w-6" />,
      bgColor: "bg-lime-400",
      textColor: "text-black",
      description: "¡Increíble constancia!"
    },
    {
      title: "Proyectos Completados",
      value: "23",
      subtitle: "este trimestre",
      icon: <RocketLaunchIcon className="h-6 w-6" />,
      bgColor: "bg-yellow-400",
      textColor: "text-black",
      description: "¡Superando metas!"
    }
  ];

  return (
    <EmojiProvider data={emojiData}>
      <DashboardLayout>
        {/* Layout principal con sidebar de calendario */}
        <div className="flex gap-8">
          {/* Contenido principal */}
          <div className="flex-1 space-y-8 min-w-0">
            {/* Estadísticas con colores lime/amarillo */}
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {motivationalStats.map((stat, index) => (
                  <div key={index} className={`${stat.bgColor} rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${stat.textColor}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-bold mb-1 opacity-70">
                          {stat.title}
                        </div>
                        <div className="text-4xl font-black mb-1">
                          {stat.value}
                        </div>
                        <div className="text-xs mb-2 opacity-70">
                          {stat.subtitle}
                        </div>
                        <div className="text-xs font-bold opacity-80">
                          {stat.description}
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/10">
                        {React.cloneElement(stat.icon, { className: "h-6 w-6" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 📊 Chart de Vistas - Tamaño completo */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-zinc-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-lime-400 rounded-xl">
                  <PlayIcon className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Vistas de Videos</h3>
                  <p className="text-sm text-zinc-600">Últimos 7 días • Actualizado hace 5 min</p>
                </div>
              </div>
              <div className="h-80 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockVideoViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717a"
                      fontSize={12}
                      fontWeight="500"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#71717a"
                      fontSize={12}
                      fontWeight="500"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="videos"
                      name="Videos"
                      stroke="#84cc16"
                      strokeWidth={3}
                      dot={{ fill: "#84cc16", r: 4 }}
                      activeDot={{ r: 6, fill: "#84cc16", stroke: "white", strokeWidth: 2 }}
                      animationDuration={2000}
                    />
                    <Line
                      type="monotone"
                      dataKey="lives"
                      name="Lives"
                      stroke="#facc15"
                      strokeWidth={3}
                      dot={{ fill: "#facc15", r: 4 }}
                      activeDot={{ r: 6, fill: "#facc15", stroke: "white", strokeWidth: 2 }}
                      animationDuration={2000}
                      animationBegin={200}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Pico máximo: <strong className="text-lime-600">3.2K vistas</strong></span>
                <span className="text-zinc-600">Crecimiento: <strong className="text-green-600">+15%</strong> vs semana pasada</span>
              </div>
            </div>

            {/* 🎯 Fila principal: Inspiración + Energía + Estado de Producción */}

              {/* 💡 Frase Inspiracional */}
              <div className="bg-slate-800 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                  <LightBulbIcon className="h-24 w-24" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
                    <div className="p-2 bg-lime-400 rounded-xl">
                      <LightBulbIcon className="h-5 w-5 text-black" />
                    </div>
                    <span>Inspiración del Día</span>
                  </h3>
                  <blockquote className="text-sm italic mb-4 leading-relaxed text-slate-300">
                    "{inspirationalQuote.text}"
                  </blockquote>
                  <cite className="text-xs text-slate-400 font-medium">— {inspirationalQuote.author}</cite>
                </div>
              </div>

            {/* 🏆 Segunda fila: Colaborador del mes + Próximos cumpleaños */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* 🏆 Colaborador del mes */}
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-zinc-200">
                {/* Header con lime */}
                <div className="bg-lime-400 p-6">
                  <div className="flex items-center gap-3 text-black">
                    <div className="p-2 bg-black/10 rounded-xl">
                      <TrophyIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Colaborador del Mes</h3>
                      <p className="text-sm font-medium flex items-center gap-2 opacity-70">
                        Mayo 2025 • ¡Felicidades!
                        <Emoji name="party popper" width={16} />
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="relative">
                      <UserProfilePhoto size="xl" />
                      <div className="absolute -bottom-1 -right-1 bg-lime-400 rounded-full p-2 shadow-lg">
                        <Emoji name="glowing star" width={16} />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-xl font-bold text-zinc-900">
                        John Doe
                      </h4>
                      <p className="text-zinc-600 mb-3 font-medium">Área de Transmisión</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs rounded-full font-medium">15 Proyectos</span>
                        <span className="px-3 py-1 bg-lime-100 text-lime-700 text-xs rounded-full font-medium">98% Calidad</span>
                        <span className="px-3 py-1 bg-stone-100 text-stone-700 text-xs rounded-full font-medium">Mentor</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-sm text-zinc-700 leading-relaxed">
                      <span className="font-semibold text-zinc-900">"Su dedicación en el proyecto FISICC</span> y su constante innovación lo convierten en un ejemplo para todo el equipo. ¡Gracias por elevar nuestros estándares!"
                    </p>
                  </div>
                </div>
              </div>

              {/* 🎂 Próximos cumpleaños */}
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-zinc-200">
                {/* Header con slate */}
                <div className="bg-slate-700 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <CakeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Próximos Cumpleaños</h3>
                      <p className="text-sm text-slate-300 font-medium flex items-center gap-2">
                        ¡Celebremos juntos!
                        <Emoji name="balloon" width={16} />
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {isLoadingBirthdays ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-400"></div>
                    </div>
                  ) : upcomingBirthdays.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600">
                      <div className="mb-3">
                        <Emoji name="birthday cake" width={48} />
                      </div>
                      <p className="mb-2 font-medium">No hay cumpleaños próximos</p>
                      <p className="text-sm flex items-center justify-center gap-2">
                        ¡Pero siempre hay motivos para celebrar!
                        <Emoji name="party popper" width={16} />
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBirthdays.map((user) => (
                        <div key={user.id} className="flex items-center p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors duration-200 border border-zinc-100">
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
                            <p className="font-semibold text-zinc-900 truncate">
                              {user.name}
                            </p>
                            <div className="flex items-center text-sm text-zinc-600 mt-1">
                              <CalendarDaysIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{formatBirthday(user.birthDate)}</span>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <span className={`px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${
                              user.daysUntilBirthday === 0 ? "bg-lime-100 text-lime-700" :
                              user.daysUntilBirthday <= 7 ? "bg-yellow-100 text-yellow-700" : "bg-zinc-100 text-zinc-600"
                            }`}>
                              {user.daysUntilBirthday === 0 ? (
                                <>¡Hoy! <Emoji name="party popper" width={12} /></>
                              ) : user.daysUntilBirthday === 1 ? (
                                <>¡Mañana! <Emoji name="birthday cake" width={12} /></>
                              ) : (
                                `En ${user.daysUntilBirthday} días`
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 📅 Sidebar Calendario - Vista de día (lado derecho) */}
          <aside className="hidden lg:block w-[350px] flex-shrink-0">
            <div className="sticky top-0">
              <Calendar view="day" />
            </div>
          </aside>
        </div>
      </DashboardLayout>
    </EmojiProvider>
  );
};

export default DashboardHome;