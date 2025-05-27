// src/App.tsx - Versión limpia y minimalista
import { AuthProvider } from './features/auth/context'
import { AppRouter } from './router/AppRouter'
import './styles/global.css'

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App