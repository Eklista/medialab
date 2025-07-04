import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Shield, Users } from "lucide-react";
import type { Role } from "@/types/forms";

const mockRoles: Role[] = [
  {
    id: "1",
    name: "super_admin",
    displayName: "Súper Administrador",
    description: "Acceso completo al God Mode con todos los permisos del sistema",
    permissions: [
      { id: "god_mode.access", name: "Acceso God Mode", module: "god_mode", action: "access" },
      { id: "users.full_crud", name: "CRUD Usuarios", module: "users", action: "full_crud" },
      { id: "roles.full_crud", name: "CRUD Roles", module: "roles", action: "full_crud" },
      { id: "system.maintenance", name: "Mantenimiento Sistema", module: "system", action: "maintenance" }
    ],
    portalAccess: "god_mode",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "admin",
    displayName: "Administrador",
    description: "Acceso completo al Dashboard para gestión del departamento",
    permissions: [
      { id: "dashboard.access", name: "Acceso Dashboard", module: "dashboard", action: "access" },
      { id: "projects.full_crud", name: "CRUD Proyectos", module: "projects", action: "full_crud" },
      { id: "equipment.full_crud", name: "CRUD Equipos", module: "equipment", action: "full_crud" },
      { id: "users.manage_clients", name: "Gestionar Clientes", module: "users", action: "manage_clients" },
      { id: "reports.full_access", name: "Acceso Reportes", module: "reports", action: "full_access" }
    ],
    portalAccess: "dashboard",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "collaborator",
    displayName: "Colaborador",
    description: "Miembro del equipo con acceso avanzado al Portal Cliente",
    permissions: [
      { id: "client_portal.access", name: "Acceso Portal Cliente", module: "client_portal", action: "access" },
      { id: "projects.create_edit", name: "Crear/Editar Proyectos", module: "projects", action: "create_edit" },
      { id: "equipment.view_reserve", name: "Ver/Reservar Equipos", module: "equipment", action: "view_reserve" },
      { id: "services.view", name: "Ver Servicios", module: "services", action: "view" }
    ],
    portalAccess: "client_portal",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "4",
    name: "client",
    displayName: "Cliente",
    description: "Cliente con acceso básico al Portal Cliente para solicitar servicios",
    permissions: [
      { id: "client_portal.access", name: "Acceso Portal Cliente", module: "client_portal", action: "access" },
      { id: "projects.view_own", name: "Ver Proyectos Propios", module: "projects", action: "view_own" },
      { id: "projects.create_request", name: "Solicitar Proyectos", module: "projects", action: "create_request" },
      { id: "services.view_request", name: "Ver/Solicitar Servicios", module: "services", action: "view_request" }
    ],
    portalAccess: "client_portal",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

// Mock data para contar usuarios por rol
const userCountByRole: { [key: string]: number } = {
  "1": 1, // Súper Administrador
  "2": 2, // Administrador
  "3": 4, // Colaborador
  "4": 15  // Cliente
};

interface RolesTableProps {
  onEdit: (role: Role) => void;
  onDelete: (id: string) => void;
}

export default function RolesTable({ onEdit, onDelete }: RolesTableProps) {
  const [roles] = useState<Role[]>(mockRoles);

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return 'text-purple-400';
      case 'admin':
        return 'text-blue-400';
      case 'collaborator':
        return 'text-green-400';
      case 'client':
        return 'text-orange-400';
      default:
        return 'text-zinc-400';
    }
  };

  const getPortalBadge = (portalAccess: string) => {
    switch (portalAccess) {
      case 'god_mode':
        return <Badge className="bg-purple-900/50 text-purple-400 border-purple-800 font-poppins text-xs">God Mode</Badge>;
      case 'dashboard':
        return <Badge className="bg-blue-900/50 text-blue-400 border-blue-800 font-poppins text-xs">Dashboard</Badge>;
      case 'client_portal':
        return <Badge className="bg-green-900/50 text-green-400 border-green-800 font-poppins text-xs">Portal Cliente</Badge>;
      default:
        return <Badge variant="secondary" className="font-poppins text-xs">Desconocido</Badge>;
    }
  };

  const getPermissionsByModule = (permissions: any[]) => {
    const modules = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as { [key: string]: any[] });

    return Object.keys(modules).map(module => ({
      name: module === 'god_mode' ? 'God Mode' :
            module === 'dashboard' ? 'Dashboard' : 
            module === 'users' ? 'Usuarios' :
            module === 'services' ? 'Servicios' :
            module === 'equipment' ? 'Equipos' :
            module === 'projects' ? 'Proyectos' :
            module === 'client_portal' ? 'Portal' :
            module === 'reports' ? 'Reportes' :
            module === 'system' ? 'Sistema' : module,
      count: modules[module].length
    }));
  };

  return (
    <div className="rounded-md border border-zinc-700">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-zinc-300 font-poppins">Rol</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Portal de Acceso</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Permisos</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Usuarios</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Estado</TableHead>
            <TableHead className="text-zinc-300 font-poppins text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const modulePerms = getPermissionsByModule(role.permissions);
            const userCount = userCountByRole[role.id] || 0;
            
            return (
              <TableRow key={role.id} className="border-zinc-700 hover:bg-zinc-800/50">
                <TableCell className="font-poppins">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-700/50 rounded-lg">
                      <Shield className={`h-4 w-4 ${getRoleColor(role.name)}`} />
                    </div>
                    <div className="space-y-1">
                      <div className={`font-medium ${getRoleColor(role.name)}`}>
                        {role.displayName}
                      </div>
                      <div className="text-sm text-zinc-400 max-w-xs truncate">
                        {role.description}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getPortalBadge(role.portalAccess)}
                </TableCell>
                <TableCell className="font-poppins">
                  <div className="space-y-2">
                    <div className="text-sm text-zinc-300">
                      {role.permissions.length} permisos totales
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {modulePerms.slice(0, 3).map((module, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="bg-zinc-700/50 text-zinc-400 border-zinc-600 text-xs font-poppins"
                        >
                          {module.name} ({module.count})
                        </Badge>
                      ))}
                      {modulePerms.length > 3 && (
                        <Badge 
                          variant="secondary" 
                          className="bg-zinc-600/50 text-zinc-500 border-zinc-600 text-xs font-poppins"
                        >
                          +{modulePerms.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-poppins">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-300">
                      {userCount} {userCount === 1 ? 'usuario' : 'usuarios'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={role.isActive ? "default" : "secondary"}
                    className={role.isActive 
                      ? "bg-green-900/50 text-green-400 border-green-800 font-poppins" 
                      : "bg-zinc-700 text-zinc-400 border-zinc-600 font-poppins"
                    }
                  >
                    {role.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                      <DropdownMenuItem 
                        onClick={() => onEdit(role)}
                        className="text-zinc-300 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {userCount === 0 ? (
                        <DropdownMenuItem 
                          onClick={() => onDelete(role.id)}
                          className="text-red-400 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          disabled
                          className="text-zinc-600 font-poppins cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          No se puede eliminar ({userCount} usuarios)
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}