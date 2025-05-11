import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Páginas
import LoginPage from './pages/auth/LoginPage';
import PortalLayout from './components/layout/PortalLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import RequestsPage from './pages/requests/RequestsPage';
import RequestDetailPage from './pages/requests/RequestDetailPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProfilePage from './pages/profile/ProfilePage';
import ProtectedRoute from './components/common/ProtectedRoute';

// Estilos
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PortalLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        
        {/* Redirección para rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;