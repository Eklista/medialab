// src/components/sections/LiveStreamingCTA.tsx
import React from 'react';
import { Button } from '../ui/Button';
import { 
  PlayIcon, 
  SignalIcon, 
  EyeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface LiveStreamingCTAProps {
  onTwitchClick?: () => void;
  className?: string;
}

export const LiveStreamingCTA: React.FC<LiveStreamingCTAProps> = ({
  onTwitchClick,
  className = ''
}) => {
  return (
    <section className={`py-20 bg-gray-900 text-white relative overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>EN VIVO</span>
            </div>
            
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Transmisiones en Vivo
              <span className="block text-gray-300">MediaLab UG</span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              No te pierdas ningún evento importante. Seguinos en Twitch para ver 
              en vivo graduaciones, conferencias magistrales y eventos especiales 
              de Universidad Galileo.
            </p>

            {/* Live Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <SignalIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Transmisión en Alta Calidad</h3>
                  <p className="text-sm text-gray-400">Stream profesional en 1080p</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <EyeIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Chat Interactivo</h3>
                  <p className="text-sm text-gray-400">Participa y comenta en tiempo real</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <PlayIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Grabaciones Disponibles</h3>
                  <p className="text-sm text-gray-400">Revive los eventos cuando quieras</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              variant="primary"
              size="xl"
              onClick={onTwitchClick}
              rightIcon={<ArrowTopRightOnSquareIcon className="h-5 w-5" />}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Ver en Twitch
            </Button>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 relative">
              {/* Fake Twitch Interface */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-purple-600 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="font-bold text-purple-600 text-sm">UG</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">MediaLab_UG</div>
                    <div className="text-xs text-purple-200">Universidad Galileo</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-medium">LIVE</span>
                  </div>
                </div>

                {/* Video Area */}
                <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                  <PlayIcon className="h-16 w-16 text-gray-600" />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    Graduación FISICC 2024
                  </div>
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-sm">
                    🔴 EN VIVO
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="p-4 text-sm">
                  <div className="space-y-2 text-gray-300">
                    <div><span className="text-purple-400">@estudiante_ug:</span> ¡Felicidades a todos! 🎓</div>
                    <div><span className="text-green-400">@familia_jose:</span> Muy emocionada por mi hijo</div>
                    <div><span className="text-blue-400">@medialab_mod:</span> ¡Bienvenidos al stream!</div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-red-600 text-white p-3 rounded-full shadow-lg">
                <SignalIcon className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-600 text-white p-3 rounded-full shadow-lg">
                <EyeIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};