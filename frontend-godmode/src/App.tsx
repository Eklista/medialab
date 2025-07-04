import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import AppLayout from './components/layout/AppLayout';
import Login from './views/auth/Login';
import Dashboard from './views/dashboard/Dashboard';
import ServiceTypes from './views/services/ServiceTypes';
import Services from './views/services/Services';
import EquipmentTypes from './views/equipment/EquipmentTypes';
import Equipment from './views/equipment/Equipment';
import Locations from './views/equipment/Locations';
import Users from './views/users/Users';
import Roles from './views/users/Roles';
import AppSettings from './views/config/AppSettings';
import SMTPConfig from './views/config/SMTPConfig';
import WorkflowConfig from './views/config/WorkflowConfig';

function App() {

  return (
  <Router>
    <Routes>
      {/* Ruta sin layout */}
      <Route path="/login" element={<Login />} />

      {/* Rutas con layout */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Services */}
        <Route path="/services/types" element={<ServiceTypes />} />
        <Route path="/services/services" element={<Services />} />

        {/* Equipment */}
        <Route path="/equipment/types" element={<EquipmentTypes />} />
        <Route path="/equipment/units" element={<Equipment />} />
        <Route path="/equipment/locations" element={<Locations />} />

        {/* Users */}
        <Route path="/users/users" element={<Users />} />
        <Route path="/users/roles" element={<Roles />} />

        {/* Config */}
        <Route path="/config/app" element={<AppSettings />} />
        <Route path="/config/smtp" element={<SMTPConfig />} />
        <Route path="/config/workflows" element={<WorkflowConfig />} />

        {/* Fallback dentro del layout */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>

    <Toaster />
  </Router>
);
}

export default App;