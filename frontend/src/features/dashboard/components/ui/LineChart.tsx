import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlayIcon, EyeIcon, TvIcon } from '@heroicons/react/24/outline';

// Tipos
interface ChartData {
  date: string;
  videosVistas?: number;
  proyectosVistas?: number;
  totalVistas?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  fill?: string;
}

// Mock data para vistas de reproducción
const mockData: ChartData[] = [
  { date: '01 Jun', videosVistas: 1200, proyectosVistas: 800, totalVistas: 2000 },
  { date: '02 Jun', videosVistas: 1800, proyectosVistas: 1200, totalVistas: 3000 },
  { date: '03 Jun', videosVistas: 1600, proyectosVistas: 1000, totalVistas: 2600 },
  { date: '04 Jun', videosVistas: 2200, proyectosVistas: 1500, totalVistas: 3700 },
  { date: '05 Jun', videosVistas: 2800, proyectosVistas: 1800, totalVistas: 4600 },
  { date: '06 Jun', videosVistas: 2400, proyectosVistas: 1600, totalVistas: 4000 },
  { date: '07 Jun', videosVistas: 3200, proyectosVistas: 2100, totalVistas: 5300 },
  { date: '08 Jun', videosVistas: 2900, proyectosVistas: 1900, totalVistas: 4800 },
  { date: '09 Jun', videosVistas: 3500, proyectosVistas: 2300, totalVistas: 5800 }
];

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-lg border border-zinc-200">
        <p className="font-bold text-zinc-900 mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-zinc-700">
              {entry.name}: {entry.value.toLocaleString()} vistas
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Dot personalizado para los puntos de las líneas
const CustomDot = ({ cx, cy, fill }: CustomDotProps) => {
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={4} 
      fill={fill} 
      stroke="white" 
      strokeWidth={2}
      className="drop-shadow-sm"
    />
  );
};

const AnimatedLineChart = () => {
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'videos' | 'proyectos'>('all');

  // Métricas para mostrar en cards
  const currentViews = {
    videos: 3500,
    proyectos: 2300,
    total: 5800,
    growth: 12.5
  };

  // Filtrar datos según métrica seleccionada
  const getFilteredData = (): ChartData[] => {
    if (selectedMetric === 'videos') {
      return mockData.map(item => ({ 
        date: item.date, 
        videosVistas: item.videosVistas 
      }));
    }
    if (selectedMetric === 'proyectos') {
      return mockData.map(item => ({ 
        date: item.date, 
        proyectosVistas: item.proyectosVistas 
      }));
    }
    return mockData;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-zinc-200">
      {/* Header del chart */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
            <div className="p-2 bg-lime-400 rounded-xl">
              <EyeIcon className="h-6 w-6 text-black" />
            </div>
            Vistas de Reproducción
          </h3>
          <p className="text-sm text-zinc-600 mt-1">
            Últimos 9 días • Actualizado hace 5 min
          </p>
        </div>
        
        {/* Selector de métricas */}
        <div className="flex bg-zinc-100 rounded-xl p-1">
          <button
            onClick={() => setSelectedMetric('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedMetric === 'all' 
                ? 'bg-lime-400 text-black' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Todo
          </button>
          <button
            onClick={() => setSelectedMetric('videos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedMetric === 'videos' 
                ? 'bg-lime-400 text-black' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setSelectedMetric('proyectos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedMetric === 'proyectos' 
                ? 'bg-lime-400 text-black' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Proyectos
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-lime-50 rounded-2xl p-4 border border-lime-200">
          <div className="flex items-center gap-2 mb-2">
            <PlayIcon className="h-4 w-4 text-lime-600" />
            <span className="text-xs font-bold text-lime-700">Videos</span>
          </div>
          <div className="text-2xl font-black text-lime-900">
            {currentViews.videos.toLocaleString()}
          </div>
          <div className="text-xs text-lime-600 font-medium">vistas hoy</div>
        </div>

        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <TvIcon className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-bold text-yellow-700">Proyectos</span>
          </div>
          <div className="text-2xl font-black text-yellow-900">
            {currentViews.proyectos.toLocaleString()}
          </div>
          <div className="text-xs text-yellow-600 font-medium">vistas hoy</div>
        </div>

        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <EyeIcon className="h-4 w-4 text-zinc-600" />
            <span className="text-xs font-bold text-zinc-700">Total</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">
            {currentViews.total.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 font-medium">
            +{currentViews.growth}% vs ayer
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={getFilteredData()}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            {/* Grid personalizado */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e4e4e7" 
              opacity={0.5}
            />
            
            {/* Ejes */}
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
            
            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />
            
            {/* Líneas animadas */}
            {(selectedMetric === 'all' || selectedMetric === 'videos') && (
              <Line
                type="monotone"
                dataKey="videosVistas"
                name="Videos"
                stroke="#84cc16"
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: "#84cc16", stroke: "white", strokeWidth: 2 }}
                animationBegin={0}
                animationDuration={2000}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(132, 204, 22, 0.3))'
                }}
              />
            )}
            
            {(selectedMetric === 'all' || selectedMetric === 'proyectos') && (
              <Line
                type="monotone"
                dataKey="proyectosVistas"
                name="Proyectos"
                stroke="#facc15"
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: "#facc15", stroke: "white", strokeWidth: 2 }}
                animationBegin={200}
                animationDuration={2000}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(250, 204, 21, 0.3))'
                }}
              />
            )}
            
            {selectedMetric === 'all' && (
              <Line
                type="monotone"
                dataKey="totalVistas"
                name="Total"
                stroke="#71717a"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5, fill: "#71717a", stroke: "white", strokeWidth: 2 }}
                animationBegin={400}
                animationDuration={2000}
                opacity={0.7}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer con insights */}
      <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-900">
              📈 Tendencia positiva detectada
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Las vistas han aumentado un {currentViews.growth}% en las últimas 24 horas
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Pico máximo</p>
            <p className="text-sm font-bold text-lime-600">
              {Math.max(...mockData.map(d => d.totalVistas || 0)).toLocaleString()} vistas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLineChart;