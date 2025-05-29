// src/App.tsx - Versión limpia y minimalista
import { AuthProvider } from './features/auth/context'
import { AppRouter } from './router/AppRouter'
import { AppDataProvider } from './context/AppDataContext'
import './styles/global.css'

function App() {
  return (
    <AuthProvider>           {/* Paso 1: Auth */}
      <AppDataProvider>      {/* Paso 2: Datos globales */}
        <AppRouter />         {/* Paso 3: Routing */}
      </AppDataProvider>
    </AuthProvider>
  )
}

export default App