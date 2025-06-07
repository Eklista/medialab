// src/router/AppRouter.tsx - CON RUTAS DE INVENTARIO
import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ProtectedRoute } from '../features/auth/components'
import { PublicRoute } from '../features/auth/components/PublicRoute'

// Public pages - lazy loading
const HomePage = lazy(() => import('../pages/home/HomePage'))
const RequestFormPage = lazy(() => import('../pages/request-form/RequestFormPage').then(module => ({ default: module.RequestFormPage })))
const ComponentsTest = lazy(() => import('../pages/documentation/ComponentsTest'))

// Content platform pages
const VideoPage = lazy(() => import('../pages/content-platform').then(module => ({ default: module.VideoPage })))

// Auth pages - lazy loading
const LoginPage = lazy(() => import('../features/auth/pages').then(module => ({ default: module.LoginPage })))
const PasswordRecoveryPage = lazy(() => import('../features/auth/pages').then(module => ({ default: module.PasswordRecoveryPage })))

// Dashboard pages - lazy loading (el módulo más pesado)
const DashboardHome = lazy(() => import('../features/dashboard').then(module => ({ default: module.DashboardHome })))
const ProductionPage = lazy(() => import('../features/dashboard').then(module => ({ default: module.ProductionPage })))
const CoursesPage = lazy(() => import('../features/dashboard').then(module => ({ default: module.CoursesPage })))
const PodcastPage = lazy(() => import('../features/dashboard').then(module => ({ default: module.PodcastPage })))
const RequestsPage = lazy(() => import('../features/dashboard').then(module => ({ default: module.RequestsPage })))
const UsersPage = lazy(() => import('../features/dashboard').then(module => ({ default: module.UsersPage })))
const AppSettingsPage = lazy(() => import('../features/dashboard').then(module => ({ default: module.AppSettingsPage })))
const SettingsPage = lazy(() => import('../features/dashboard').then(module => ({ default: module.SettingsPage })))
const UserProfilePage = lazy(() => import('../features/dashboard').then(module => ({ default: module.UserProfilePage })))
const CalendarPage = lazy(() => import('../features/dashboard/pages/CalendarPage'))
const RequestDetailsPage = lazy(() => import('../features/dashboard/pages/RequestDetailsPage'))

//  INVENTORY PAGES
const InventoryDashboardPage = lazy(() => import('../features/dashboard/pages/inventory/InventoryDashboardPage'))
const EquipmentPage = lazy(() => import('../features/dashboard/pages/inventory/EquipmentPage'))
//const SuppliesPage = lazy(() => import('../features/dashboard/pages/inventory/SuppliesPage'))
//const InventorySettingsPage = lazy(() => import('../features/dashboard/pages/inventory/InventorySettingsPage'))
//const InventoryReportsPage = lazy(() => import('../features/dashboard/pages/inventory/InventoryReportsPage'))

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

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 🆕 FIXED: Rutas públicas principales con PublicRoute */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LazyErrorBoundary>
              <HomePage />
            </LazyErrorBoundary>
          </PublicRoute>
        } 
      />

      <Route 
        path="/request" 
        element={
          <PublicRoute>
            <LazyErrorBoundary>
              <RequestFormPage />
            </LazyErrorBoundary>
          </PublicRoute>
        } 
      />

      {/* Rutas de contenido (videos, categorías, etc.) */}
      <Route 
        path="/video/:id" 
        element={
          <PublicRoute>
            <LazyErrorBoundary>
              <VideoPage />
            </LazyErrorBoundary>
          </PublicRoute>
        } 
      />

      {/* Rutas de documentación/testing */}
      <Route 
        path="/documentation/components-test" 
        element={
          <PublicRoute>
            <LazyErrorBoundary>
              <ComponentsTest />
            </LazyErrorBoundary>
          </PublicRoute>
        } 
      />
     
      {/* 🆕 FIXED: Rutas de autenticación con PublicRoute */}
      <Route 
        path="/ml-admin/login" 
        element={
          <PublicRoute>
            <LazyErrorBoundary>
              <LoginPage />
            </LazyErrorBoundary>
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/password-recovery" 
        element={
          <PublicRoute>
            <LazyErrorBoundary>
              <PasswordRecoveryPage />
            </LazyErrorBoundary>
          </PublicRoute>
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
          path="/dashboard/calendar" 
          element={
        <LazyErrorBoundary>
          <CalendarPage />
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

        <Route 
          path="/dashboard/inventory" 
          element={
        <LazyErrorBoundary>
          <InventoryDashboardPage />
        </LazyErrorBoundary>
          } 
        />

        <Route 
          path="/dashboard/inventory/equipment" 
          element={
        <LazyErrorBoundary>
          <EquipmentPage />
        </LazyErrorBoundary>
          } 
        />

        {/* 🆕 RUTAS DE INVENTARIO */}
        {/*
        <Route 
          path="/dashboard/inventory" 
          element={
        <LazyErrorBoundary>
          <InventoryDashboardPage />
        </LazyErrorBoundary>
          } 
        />
        
        
        
        <Route 
          path="/dashboard/inventory/supplies" 
          element={
        <LazyErrorBoundary>
          <SuppliesPage />
        </LazyErrorBoundary>
          } 
        />
        
        <Route 
          path="/dashboard/inventory/reports" 
          element={
        <LazyErrorBoundary>
          <InventoryReportsPage />
        </LazyErrorBoundary>
          } 
        />
        
        <Route 
          path="/dashboard/inventory/settings" 
          element={
        <LazyErrorBoundary>
          <InventorySettingsPage />
        </LazyErrorBoundary>
          } 
        />
        */}
      </Route>
     
      {/* Redirect para rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}