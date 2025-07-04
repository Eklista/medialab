import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Video,
  Camera,
  Users,
  Settings,
  ArrowRight,
  Activity,
  FileText
} from "lucide-react";

const auditLogs = [
  { id: 1, action: "Inicio de sesión", user: "admin@medialab.com", time: "Hace 5 min", status: "success" },
  { id: 2, action: "Creó equipo", user: "admin@medialab.com", time: "Hace 2 hrs", status: "success" },
  { id: 3, action: "Modificó servicio", user: "admin@medialab.com", time: "Hace 4 hrs", status: "success" },
  { id: 4, action: "Intento de acceso", user: "unknown@test.com", time: "Hace 6 hrs", status: "error" },
  { id: 5, action: "Eliminó usuario", user: "admin@medialab.com", time: "Ayer", status: "warning" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700/50">
        <h1 className="font-sora text-2xl font-bold text-zinc-100 mb-2">
          Panel de Administración
        </h1>
        <p className="font-poppins text-zinc-400">
          Gestiona todo el sistema Medialab desde aquí
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-sora text-zinc-100">
              <Video className="h-5 w-5 text-zinc-400" />
              Gestión de Servicios
            </CardTitle>
            <CardDescription className="font-poppins text-zinc-500">
              Configurar tipos de servicio y servicios disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Tipos de Servicio</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/services/types">
                  Gestionar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Servicios</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/services/services">
                  Gestionar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-sora text-zinc-100">
              <Camera className="h-5 w-5 text-zinc-400" />
              Gestión de Equipos
            </CardTitle>
            <CardDescription className="font-poppins text-zinc-500">
              Administrar tipos de equipo, unidades y ubicaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Tipos de Equipo</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/equipment/types">
                  Gestionar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Unidades de Equipo</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/equipment/units">
                  Gestionar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Ubicaciones</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/equipment/locations">
                  Gestionar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-sora text-zinc-100">
              <Users className="h-5 w-5 text-zinc-400" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription className="font-poppins text-zinc-500">
              Administrar usuarios y sus roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Usuarios</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/users/users">
                  Gestionar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Roles y Permisos</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/users/roles">
                  Gestionar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-sora text-zinc-100">
              <Settings className="h-5 w-5 text-zinc-400" />
              Configuración del Sistema
            </CardTitle>
            <CardDescription className="font-poppins text-zinc-500">
              Configurar ajustes de la aplicación y flujos de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Configuración de App</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/config/app">
                  Configurar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Config SMTP</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/config/smtp">
                  Configurar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-poppins text-zinc-300">Flujos de Trabajo</span>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/70">
                <Link to="/config/workflows">
                  Configurar <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-800/50 border-zinc-700/50 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-sora text-zinc-100">
                <FileText className="h-5 w-5 text-zinc-400" />
                Logs de Auditoría
              </CardTitle>
              <Button asChild variant="outline" size="sm" className="border-zinc-600 bg-zinc-200 text-zinc-900 hover:bg-zinc-800 hover:text-zinc-100">
                <Link to="/audit/logs">
                  Ver Auditorías <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <CardDescription className="font-poppins text-zinc-500">
              Actividad reciente del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700/50">
                  <TableHead className="text-zinc-400 font-poppins">Acción</TableHead>
                  <TableHead className="text-zinc-400 font-poppins">Usuario</TableHead>
                  <TableHead className="text-zinc-400 font-poppins">Tiempo</TableHead>
                  <TableHead className="text-zinc-400 font-poppins">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} className="border-zinc-700/50">
                    <TableCell className="font-poppins text-zinc-300">{log.action}</TableCell>
                    <TableCell className="font-poppins text-zinc-400">{log.user}</TableCell>
                    <TableCell className="font-poppins text-zinc-500">{log.time}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${
                          log.status === 'success' ? 'bg-green-900/50 text-green-400 border-green-800' :
                          log.status === 'error' ? 'bg-red-900/50 text-red-400 border-red-800' :
                          'bg-yellow-900/50 text-yellow-400 border-yellow-800'
                        }`}
                      >
                        {log.status === 'success' ? 'Éxito' : 
                         log.status === 'error' ? 'Error' : 'Advertencia'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-sora text-zinc-100">
              <Activity className="h-5 w-5 text-zinc-400" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Badge variant="secondary" className="gap-1 bg-zinc-700/50 text-zinc-300 border-zinc-600 justify-start">
                <div className="h-2 w-2 bg-green-400 rounded-full" />
                API Conectada
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-zinc-700/50 text-zinc-300 border-zinc-600 justify-start">
                <div className="h-2 w-2 bg-green-400 rounded-full" />
                Base de Datos Online
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-zinc-700/50 text-zinc-300 border-zinc-600 justify-start">
                <div className="h-2 w-2 bg-green-400 rounded-full" />
                Wordpress Conectado
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-zinc-700/50 text-zinc-300 border-zinc-600 justify-start">
                <div className="h-2 w-2 bg-green-400 rounded-full" />
                Dashboard Frontend Conectado
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-zinc-700/50 text-zinc-300 border-zinc-600 justify-start">
                <div className="h-2 w-2 bg-green-400 rounded-full" />
                Portal Frontend Conectado
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-zinc-700/50 text-zinc-300 border-zinc-600 justify-start">
                <div className="h-2 w-2 bg-yellow-400 rounded-full" />
                SMTP No Configurado
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}