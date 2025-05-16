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
        <Route path="/portal/login" element={<LoginPage />} />
       
        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PortalLayout />}>
            <Route path="/portal" element={<DashboardPage />} />
            <Route path="/portal/requests" element={<RequestsPage />} />
            <Route path="/portal/requests/:id" element={<RequestDetailPage />} />
            <Route path="/portal/projects" element={<ProjectsPage />} />
            <Route path="/portal/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/portal/profile" element={<ProfilePage />} />
          </Route>
        </Route>
       
        {/* Redirección para rutas no encontradas */}
        <Route path="/portal/*" element={<Navigate to="/portal" replace />} />
        {/* Redirección de la raíz a /portal */}
        <Route path="/" element={<Navigate to="/portal" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;