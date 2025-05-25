// src/components/common/InstallButton.tsx
import { usePWAInstall } from '../../hooks/usePWAInstall'

export function InstallButton() {
  const { isInstallable, handleInstall } = usePWAInstall()

  // Versión debug - siempre muestra algo
  return (
    <div>
      {isInstallable ? (
        <button
          onClick={handleInstall}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-white/30"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          Instalar App
        </button>
      ) : (
        // Debug: mostrar por qué no es instalable
        <div className="text-xs opacity-60 text-white">
          PWA: {typeof window !== 'undefined' ? 'Ya instalada o no disponible' : 'Cargando...'}
        </div>
      )}
    </div>
  )
}