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
import { MoreHorizontal, Edit, Trash2, User as UserIcon, Mail, RefreshCw, Shield } from "lucide-react";
import type { User } from "@/types/forms";

const mockUsers: User[] = [
  {
    id: "1",
    firstName: "Ana",
    lastName: "Súper",
    email: "ana.super@galileo.edu",
    roleId: "1",
    role: {
      id: "1",
      name: "super_admin",
      displayName: "Súper Administrador",
      description: "Acceso completo al God Mode",
      permissions: [],
      portalAccess: "god_mode",
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z"
    },
    status: "active",
    contractDate: "2020-01-15T00:00:00Z",
    invitedAt: "2025-01-01T00:00:00Z",
    registeredAt: "2025-01-01T08:00:00Z",
    lastLoginAt: "2025-01-03T16:45:00Z",
    department: "Dirección",
    position: "Directora Técnica",
    employeeId: "SUPER001",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-03T16:45:00Z"
  },
  {
    id: "2",
    firstName: "Pablo",
    lastName: "Lacán",
    email: "pablo.lacan@galileo.edu",
    roleId: "2",
    role: {
      id: "2",
      name: "admin",
      displayName: "Administrador",
      description: "Acceso completo al Dashboard",
      permissions: [],
      portalAccess: "dashboard",
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z"
    },
    status: "active",
    contractDate: "2017-04-21T00:00:00Z",
    invitedAt: "2025-01-01T00:00:00Z",
    registeredAt: "2025-01-01T10:30:00Z",
    lastLoginAt: "2025-01-03T14:20:00Z",
    department: "Producción Audiovisual",
    position: "Coordinador de Producción",
    employeeId: "EMP001",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-03T14:20:00Z"
  },
  {
    id: "3",
    firstName: "María",
    lastName: "González",
    email: "maria.gonzalez@galileo.edu",
    roleId: "3",
    role: {
      id: "3",
      name: "collaborator",
      displayName: "Colaborador",
      description: "Miembro del equipo con acceso al Portal Cliente",
      permissions: [],
      portalAccess: "client_portal",
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z"
    },
    status: "invited",
    contractDate: "2024-09-15T00:00:00Z",
    invitedAt: "2025-01-02T09:15:00Z",
    department: "Técnico",
    position: "Técnico Audiovisual",
    employeeId: "EMP002",
    accessLevel: "advanced",
    invitationToken: "abc123token",
    isActive: true,
    createdAt: "2025-01-02T09:15:00Z",
    updatedAt: "2025-01-02T09:15:00Z"
  },
  {
    id: "4",
    firstName: "Carlos",
    lastName: "Rodríguez",
    email: "carlos.rodriguez@empresa.com",
    roleId: "4",
    role: {
      id: "4",
      name: "client",
      displayName: "Cliente",
      description: "Cliente externo con acceso al Portal Cliente",
      permissions: [],
      portalAccess: "client_portal",
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z"
    },
    status: "active",
    contractDate: "2024-12-01T00:00:00Z",
    invitedAt: "2024-12-01T00:00:00Z",
    registeredAt: "2024-12-01T15:45:00Z",
    lastLoginAt: "2025-01-03T08:30:00Z",
    clientCompany: "Empresa XYZ S.A.",
    clientType: "external",
    position: "Director de Marketing",
    accessLevel: "basic",
    isActive: true,
    createdAt: "2024-12-01T00:00:00Z",
    updatedAt: "2025-01-03T08:30:00Z"
  },
  {
    id: "5",
    firstName: "Luis",
    lastName: "Pérez",
    email: "luis.perez@galileo.edu",
    roleId: "4",
    role: {
      id: "4",
      name: "client",
      displayName: "Cliente",
      description: "Cliente interno con acceso al Portal Cliente",
      permissions: [],
      portalAccess: "client_portal",
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z"
    },
    status: "active",
    contractDate: "2024-11-10T00:00:00Z",
    invitedAt: "2024-11-10T00:00:00Z",
    registeredAt: "2024-11-10T12:30:00Z",
    lastLoginAt: "2025-01-02T10:15:00Z",
    clientCompany: "Universidad Galileo - Facultad de Ingeniería",
    clientType: "internal",
    position: "Coordinador Académico",
    accessLevel: "basic",
    isActive: true,
    createdAt: "2024-11-10T00:00:00Z",
    updatedAt: "2025-01-02T10:15:00Z"
  }
];

interface UsersTableProps {
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onResendInvitation: (user: User) => void;
}

export default function UsersTable({ onEdit, onDelete, onResendInvitation }: UsersTableProps) {
  const [users] = useState<User[]>(mockUsers);

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-900/50 text-green-400 border-green-800 font-poppins">Activo</Badge>;
      case 'invited':
        return <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-800 font-poppins">Invitado</Badge>;
      case 'inactive':
        return <Badge className="bg-zinc-700 text-zinc-400 border-zinc-600 font-poppins">Inactivo</Badge>;
      case 'suspended':
        return <Badge className="bg-red-900/50 text-red-400 border-red-800 font-poppins">Suspendido</Badge>;
      default:
        return <Badge variant="secondary" className="font-poppins">Desconocido</Badge>;
    }
  };

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

  const getPortalInfo = (portalAccess: string) => {
    switch (portalAccess) {
      case 'god_mode':
        return { name: 'God Mode', color: 'text-purple-400' };
      case 'dashboard':
        return { name: 'Dashboard', color: 'text-blue-400' };
      case 'client_portal':
        return { name: 'Portal Cliente', color: 'text-green-400' };
      default:
        return { name: 'Desconocido', color: 'text-zinc-400' };
    }
  };

  return (
    <div className="rounded-md border border-zinc-700">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-zinc-300 font-poppins">Usuario</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Rol y Portal</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Información Adicional</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Estado</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Último Acceso</TableHead>
            <TableHead className="text-zinc-300 font-poppins text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const portalInfo = getPortalInfo(user.role?.portalAccess || '');
            
            return (
              <TableRow key={user.id} className="border-zinc-700 hover:bg-zinc-800/50">
                <TableCell className="font-poppins">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-zinc-100">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-zinc-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.position && (
                        <div className="text-xs text-zinc-500">
                          {user.position}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className={`h-4 w-4 ${getRoleColor(user.role?.name || '')}`} />
                      <div>
                        <div className={`font-medium ${getRoleColor(user.role?.name || '')}`}>
                          {user.role?.displayName}
                        </div>
                        <div className={`text-xs ${portalInfo.color}`}>
                          → {portalInfo.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-poppins">
                  <div className="space-y-1 text-sm">
                    {user.department && (
                      <div className="text-zinc-400">
                        <strong>Dept:</strong> {user.department}
                      </div>
                    )}
                    {user.clientCompany && (
                      <div className="text-zinc-400">
                        <strong>Empresa:</strong> {user.clientCompany}
                      </div>
                    )}
                    {user.clientType && (
                      <div className="text-zinc-500 text-xs">
                        Cliente {user.clientType === 'internal' ? 'Interno' : 'Externo'}
                      </div>
                    )}
                    {user.employeeId && (
                      <div className="text-zinc-500 text-xs">
                        ID: {user.employeeId}
                      </div>
                    )}
                    {user.accessLevel && user.role?.name === 'collaborator' && (
                      <div className="text-zinc-500 text-xs">
                        Acceso {user.accessLevel === 'advanced' ? 'Avanzado' : 'Básico'}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.status)}
                </TableCell>
                <TableCell className="text-zinc-400 font-poppins">
                  {user.lastLoginAt ? (
                    <div className="space-y-1">
                      <div className="text-sm">
                        {new Date(user.lastLoginAt).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(user.lastLoginAt).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ) : user.status === 'invited' ? (
                    <div className="text-sm text-yellow-400">
                      Pendiente de registro
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500">
                      Nunca
                    </div>
                  )}
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
                        onClick={() => onEdit(user)}
                        className="text-zinc-300 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {user.status === 'invited' && (
                        <DropdownMenuItem 
                          onClick={() => onResendInvitation(user)}
                          className="text-blue-400 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reenviar Invitación
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDelete(user.id)}
                        className="text-red-400 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
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