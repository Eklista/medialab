// src/App.tsx - Corrección de rutas duplicadas y organización
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { RequestFormPage } from './pages/request-form/RequestFormPage'
import ComponentsTest from './pages/documentation/ComponentsTest'
import { AuthProvider } from './features/auth/context'
import { LoginPage, PasswordRecoveryPage } from './features/auth/pages'
import { ProtectedRoute } from './features/auth/components'
import {
  DashboardHome,
  ProductionPage,
  CoursesPage,
  PodcastPage,
  RequestsPage,
  UsersPage,
  AppSettingsPage,
  SettingsPage,
  UserProfilePage
} from './features/dashboard'
import RequestDetailsPage from './features/dashboard/pages/RequestDetailsPage'
import './styles/global.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/request" element={<RequestFormPage />} />
        <Route path="/documentation/components-test" element={<ComponentsTest />} />
        
        {/* Rutas de autenticación */}
        <Route path="/ml-admin/login" element={<LoginPage />} />
        <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
       
        {/* Rutas protegidas del dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/production" element={<ProductionPage />} />
          <Route path="/dashboard/courses" element={<CoursesPage />} />
          <Route path="/dashboard/podcast" element={<PodcastPage />} />
          <Route path="/dashboard/requests" element={<RequestsPage />} />
          <Route path="/dashboard/requests/:id" element={<RequestDetailsPage />} />
          <Route path="/dashboard/users" element={<UsersPage />} />
          {/* CORRECCIÓN: Remover doble slash */}
          <Route path="/dashboard/app-settings/*" element={<AppSettingsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/users/:userId" element={<UserProfilePage />} />
        </Route>
       
        {/* Redirigir rutas no definidas a la página principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App