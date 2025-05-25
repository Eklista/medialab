// src/components/InstallButton.tsx
import { usePWAInstall } from '../../hooks/usePWAInstall'

export function InstallButton() {
  const { isInstallable, handleInstall } = usePWAInstall()

  // Si no es instalable, no mostrar el botón
  if (!isInstallable) {
    return null
  }

  return (
    <button
      onClick={handleInstall}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
  )
}