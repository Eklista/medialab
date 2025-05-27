// src/App.tsx - Con lazy loading optimizado
import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/context'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import './styles/global.css'

// Lazy loading de páginas principales
const HomePage = lazy(() => import('./pages/home/HomePage'))
const RequestFormPage = lazy(() => import('./pages/request-form/RequestFormPage').then(module => ({ default: module.RequestFormPage })))
const ComponentsTest = lazy(() => import('./pages/documentation/ComponentsTest'))

// Auth pages - lazy loading
const LoginPage = lazy(() => import('./features/auth/pages').then(module => ({ default: module.LoginPage })))
const PasswordRecoveryPage = lazy(() => import('./features/auth/pages').then(module => ({ default: module.PasswordRecoveryPage })))

// Dashboard pages - lazy loading (el módulo más pesado)
const DashboardHome = lazy(() => import('./features/dashboard').then(module => ({ default: module.DashboardHome })))
const ProductionPage = lazy(() => import('./features/dashboard').then(module => ({ default: module.ProductionPage })))
const CoursesPage = lazy(() => import('./features/dashboard').then(module => ({ default: module.CoursesPage })))
const PodcastPage = lazy(() => import('./features/dashboard').then(module => ({ default: module.PodcastPage })))
const RequestsPage = lazy(() => import('./features/dashboard').then(module => ({ default: module.RequestsPage })))
const UsersPage = lazy(() => import('./features/dashboard').then(module => ({ default: module.UsersPage })))
const AppSettingsPage = lazy(() => import('./features/dashboard').then(module => ({ default: module.AppSettingsPage })))
const SettingsPage = lazy(() => import('./features/dashboard').then(module => ({ default: module.SettingsPage })))
const UserProfilePage = lazy(() => import('./features/dashboard').then(module => ({ default: module.UserProfilePage })))
const RequestDetailsPage = lazy(() => import('./features/dashboard/pages/RequestDetailsPage'))

// ProtectedRoute - mantener directo ya que es crítico para la seguridad
import { ProtectedRoute } from './features/auth/components'

// Componente de loading personalizado
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-(--color-bg-main)">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-(--color-text-secondary)">
        Cargando página...
      </p>
    </div>
  </div>
)

// Error boundary simple para lazy loading
const LazyErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route 
            path="/" 
            element={
              <LazyErrorBoundary>
                <HomePage />
              </LazyErrorBoundary>
            } 
          />
          <Route 
            path="/request" 
            element={
              <LazyErrorBoundary>
                <RequestFormPage />
              </LazyErrorBoundary>
            } 
          />
          <Route 
            path="/documentation/components-test" 
            element={
              <LazyErrorBoundary>
                <ComponentsTest />
              </LazyErrorBoundary>
            } 
          />
         
          {/* Rutas de autenticación */}
          <Route 
            path="/ml-admin/login" 
            element={
              <LazyErrorBoundary>
                <LoginPage />
              </LazyErrorBoundary>
            } 
          />
          <Route 
            path="/password-recovery" 
            element={
              <LazyErrorBoundary>
                <PasswordRecoveryPage />
              </LazyErrorBoundary>
            } 
          />
         
          {/* Rutas protegidas del dashboard */}
          <Route element={<ProtectedRoute />}>
            <Route 
              path="/dashboard" 
              element={
                <LazyErrorBoundary>
                  <DashboardHome />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/production" 
              element={
                <LazyErrorBoundary>
                  <ProductionPage />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/courses" 
              element={
                <LazyErrorBoundary>
                  <CoursesPage />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/podcast" 
              element={
                <LazyErrorBoundary>
                  <PodcastPage />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/requests" 
              element={
                <LazyErrorBoundary>
                  <RequestsPage />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/requests/:id" 
              element={
                <LazyErrorBoundary>
                  <RequestDetailsPage />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/users" 
              element={
                <LazyErrorBoundary>
                  <UsersPage />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/app-settings/*" 
              element={
                <LazyErrorBoundary>
                  <AppSettingsPage />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/settings" 
              element={
                <LazyErrorBoundary>
                  <SettingsPage />
                </LazyErrorBoundary>
              } 
            />
            <Route 
              path="/dashboard/users/:userId" 
              element={
                <LazyErrorBoundary>
                  <UserProfilePage />
                </LazyErrorBoundary>
              } 
            />
          </Route>
         
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </AuthProvider>
  )
}

export default App