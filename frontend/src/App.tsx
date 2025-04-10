// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { RequestFormPage } from './pages/request-form/RequestFormPage'
import ComponentsTest from './pages/documentation/ComponentsTest'
import { AuthProvider } from './features/auth/context'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from './features/auth/pages'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import './styles/global.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/request" element={<RequestFormPage />} />
        <Route path="/documentation/components-test" element={<ComponentsTest />} />

        {/* Página principal accesible para todos */}
        <Route path="/" element={<HomePage />} />
        
        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
        </Route>
        
        {/* Redirigir rutas no definidas a la página principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App