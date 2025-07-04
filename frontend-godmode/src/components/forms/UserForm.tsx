import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Mail, Calendar, Briefcase, Building, Shield } from "lucide-react";
import type { User as UserType, UserFormData, Role } from "@/types/forms";

const mockRoles: Role[] = [
  {
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
  {
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
  {
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
  {
    id: "4",
    name: "client",
    displayName: "Cliente",
    description: "Cliente con acceso al Portal Cliente",
    permissions: [],
    portalAccess: "client_portal",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

const departments = [
  "Producción Audiovisual",
  "Técnico",
  "Administración",
  "Creatividad",
  "Post-producción",
  "Marketing",
  "Recursos Humanos",
  "Dirección"
];

interface UserFormProps {
  user?: UserType;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UserForm({ 
  user, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: UserFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      roleId: user?.roleId || "",
      contractDate: user?.contractDate ? user.contractDate.split('T')[0] : "",
      department: user?.department || "",
      position: user?.position || "",
      clientCompany: user?.clientCompany || "",
      clientType: user?.clientType || "external",
      employeeId: user?.employeeId || "",
      accessLevel: user?.accessLevel || "basic",
      isActive: user?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");
  const roleId = watch("roleId");
  const selectedRole = mockRoles.find(role => role.id === roleId);

  const isClientRole = selectedRole?.name === 'client';
  const isCollaboratorRole = selectedRole?.name === 'collaborator';

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return <Shield className="h-5 w-5 text-purple-500" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'collaborator':
        return <User className="h-5 w-5 text-green-500" />;
      case 'client':
        return <User className="h-5 w-5 text-orange-500" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Personal */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <User className="h-6 w-6 text-zinc-400" />
            Información Personal
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="firstName" className="text-zinc-200 font-poppins font-medium text-base">
                Nombre *
              </Label>
              <Input
                id="firstName"
                placeholder="ej. Pablo"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("firstName", { required: "El nombre es requerido" })}
              />
              {errors.firstName && (
                <p className="text-red-400 text-sm font-poppins">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="lastName" className="text-zinc-200 font-poppins font-medium text-base">
                Apellido *
              </Label>
              <Input
                id="lastName"
                placeholder="ej. Lacán"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("lastName", { required: "El apellido es requerido" })}
              />
              {errors.lastName && (
                <p className="text-red-400 text-sm font-poppins">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="email" className="text-zinc-200 font-poppins font-medium text-base">
                Correo Electrónico *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ej. pablo.lacan@galileo.edu"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins pl-11"
                  {...register("email", { 
                    required: "El correo es requerido",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Correo electrónico inválido"
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm font-poppins">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-200 font-poppins font-medium text-base">
                Estado
              </Label>
              <Select 
                value={isActive ? "true" : "false"} 
                onValueChange={(value) => setValue("isActive", value === "true")}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    {isActive ? (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Activo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-zinc-500 rounded-full"></div>
                        <span>Inactivo</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  <SelectItem value="true" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Activo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="false" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-zinc-500 rounded-full"></div>
                      <span>Inactivo</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Información de Rol y Acceso */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Shield className="h-6 w-6 text-zinc-400" />
            Rol y Acceso al Sistema
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="roleId" className="text-zinc-200 font-poppins font-medium text-base">
                Tipo de Usuario *
              </Label>
              <Select 
                value={roleId} 
                onValueChange={(value) => setValue("roleId", value)}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    {selectedRole ? (
                      <div className="flex items-center gap-3">
                        {getRoleIcon(selectedRole.name)}
                        <div className="text-left">
                          <div>{selectedRole.displayName}</div>
                          <div className="text-xs text-zinc-500">{selectedRole.description}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Selecciona un tipo de usuario</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  {mockRoles.map((role) => (
                    <SelectItem 
                      key={role.id} 
                      value={role.id}
                      className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                    >
                      <div className="flex items-center gap-3">
                        {getRoleIcon(role.name)}
                        <div className="text-left">
                          <div>{role.displayName}</div>
                          <div className="text-xs text-zinc-500">{role.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className="text-red-400 text-sm font-poppins">{errors.roleId.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="contractDate" className="text-zinc-200 font-poppins font-medium text-base">
                {isClientRole ? "Fecha de Registro" : "Fecha de Contratación"} *
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="contractDate"
                  type="date"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins pl-11"
                  {...register("contractDate", { required: "La fecha es requerida" })}
                />
              </div>
              {errors.contractDate && (
                <p className="text-red-400 text-sm font-poppins">{errors.contractDate.message}</p>
              )}
            </div>
          </div>

          {/* Portal de acceso info */}
          {selectedRole && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-blue-300 text-sm font-poppins">
                <strong>Portal de acceso:</strong> {
                  selectedRole.portalAccess === 'god_mode' ? 'God Mode (Súper Administración)' :
                  selectedRole.portalAccess === 'dashboard' ? 'Dashboard (Administración)' :
                  'Portal Cliente'
                }
              </p>
            </div>
          )}
        </div>

        {/* Campos específicos por tipo de usuario */}
        {isClientRole && (
          <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
            <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
              <Building className="h-6 w-6 text-zinc-400" />
              Información del Cliente
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="clientCompany" className="text-zinc-200 font-poppins font-medium text-base">
                  Empresa/Organización
                </Label>
                <Input
                  id="clientCompany"
                  placeholder="ej. Universidad Galileo"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                  {...register("clientCompany")}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-zinc-200 font-poppins font-medium text-base">
                  Tipo de Cliente
                </Label>
                <Select 
                  value={watch("clientType") || "external"} 
                  onValueChange={(value) => setValue("clientType", value as "internal" | "external")}
                >
                  <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                    <SelectValue>
                      {watch("clientType") === "internal" ? (
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-blue-500" />
                          <span>Cliente Interno (Universidad)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-orange-500" />
                          <span>Cliente Externo</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                    <SelectItem value="internal" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-blue-500" />
                        <span>Cliente Interno (Universidad)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="external" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-orange-500" />
                        <span>Cliente Externo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {isCollaboratorRole && (
          <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
            <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-zinc-400" />
              Información del Colaborador
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="employeeId" className="text-zinc-200 font-poppins font-medium text-base">
                  ID de Empleado
                </Label>
                <Input
                  id="employeeId"
                  placeholder="ej. EMP001"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                  {...register("employeeId")}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-zinc-200 font-poppins font-medium text-base">
                  Nivel de Acceso
                </Label>
                <Select 
                  value={watch("accessLevel") || "basic"} 
                  onValueChange={(value) => setValue("accessLevel", value as "basic" | "advanced")}
                >
                  <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                    <SelectValue>
                      {watch("accessLevel") === "advanced" ? (
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-green-500" />
                          <span>Acceso Avanzado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-blue-500" />
                          <span>Acceso Básico</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                    <SelectItem value="basic" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <span>Acceso Básico</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-green-500" />
                        <span>Acceso Avanzado</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Información Laboral (solo para admins y colaboradores) */}
        {!isClientRole && (
          <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
            <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-zinc-400" />
              Información Laboral
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="department" className="text-zinc-200 font-poppins font-medium text-base">
                  Departamento
                </Label>
                <Select 
                  value={watch("department") || ""} 
                  onValueChange={(value) => setValue("department", value)}
                >
                  <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                    <SelectValue>
                      {watch("department") ? (
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5" />
                          <span>{watch("department")}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">Selecciona un departamento</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                    {departments.map((dept) => (
                      <SelectItem 
                        key={dept} 
                        value={dept}
                        className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                      >
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5" />
                          <span>{dept}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="position" className="text-zinc-200 font-poppins font-medium text-base">
                  Cargo/Posición
                </Label>
                <Input
                  id="position"
                  placeholder="ej. Coordinador de Producción"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                  {...register("position")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Información de Invitación */}
        {!user && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
            <h4 className="text-blue-400 font-poppins font-medium mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Proceso de Invitación
            </h4>
            <div className="text-sm text-blue-300 font-poppins space-y-2">
              <p>• Se enviará una invitación al correo electrónico proporcionado</p>
              <p>• El usuario recibirá un enlace para completar su registro</p>
              <p>• Podrá establecer su contraseña y completar su perfil</p>
              <p>• El acceso será al {selectedRole?.portalAccess === 'god_mode' ? 'God Mode' : 
                selectedRole?.portalAccess === 'dashboard' ? 'Dashboard' : 'Portal Cliente'}</p>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4 pt-6 border-t border-zinc-700">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 font-poppins px-6 h-12"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-poppins px-8 h-12"
          >
            {isLoading ? "Enviando invitación..." : user ? "Actualizar Usuario" : "Enviar Invitación"}
          </Button>
        </div>
      </form>
    </div>
  );
}