import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Settings, Users, Camera, Video, FileText, BarChart } from "lucide-react";
import type { Role, RoleFormData, Permission } from "@/types/forms";

const modulePermissions: { [key: string]: Permission[] } = {
  "dashboard": [
    { id: "dashboard.view", name: "Ver Dashboard", module: "dashboard", action: "view", description: "Acceso al panel principal" },
    { id: "dashboard.stats", name: "Ver Estadísticas", module: "dashboard", action: "stats", description: "Ver métricas y reportes" }
  ],
  "users": [
    { id: "users.view", name: "Ver Usuarios", module: "users", action: "view", description: "Listar usuarios del sistema" },
    { id: "users.create", name: "Crear Usuarios", module: "users", action: "create", description: "Invitar nuevos usuarios" },
    { id: "users.edit", name: "Editar Usuarios", module: "users", action: "edit", description: "Modificar información de usuarios" },
    { id: "users.delete", name: "Eliminar Usuarios", module: "users", action: "delete", description: "Eliminar usuarios del sistema" },
    { id: "roles.manage", name: "Gestionar Roles", module: "users", action: "manage_roles", description: "Crear y modificar roles" }
  ],
  "services": [
    { id: "services.view", name: "Ver Servicios", module: "services", action: "view", description: "Consultar servicios disponibles" },
    { id: "services.create", name: "Crear Servicios", module: "services", action: "create", description: "Agregar nuevos servicios" },
    { id: "services.edit", name: "Editar Servicios", module: "services", action: "edit", description: "Modificar servicios existentes" },
    { id: "services.delete", name: "Eliminar Servicios", module: "services", action: "delete", description: "Eliminar servicios" }
  ],
  "equipment": [
    { id: "equipment.view", name: "Ver Equipos", module: "equipment", action: "view", description: "Consultar inventario de equipos" },
    { id: "equipment.create", name: "Crear Equipos", module: "equipment", action: "create", description: "Agregar nuevos equipos" },
    { id: "equipment.edit", name: "Editar Equipos", module: "equipment", action: "edit", description: "Modificar información de equipos" },
    { id: "equipment.delete", name: "Eliminar Equipos", module: "equipment", action: "delete", description: "Eliminar equipos del inventario" },
    { id: "equipment.reserve", name: "Reservar Equipos", module: "equipment", action: "reserve", description: "Reservar equipos para proyectos" }
  ],
  "projects": [
    { id: "projects.view", name: "Ver Proyectos", module: "projects", action: "view", description: "Consultar proyectos" },
    { id: "projects.create", name: "Crear Proyectos", module: "projects", action: "create", description: "Iniciar nuevos proyectos" },
    { id: "projects.edit", name: "Editar Proyectos", module: "projects", action: "edit", description: "Modificar proyectos existentes" },
    { id: "projects.approve", name: "Aprobar Proyectos", module: "projects", action: "approve", description: "Aprobar o rechazar proyectos" }
  ],
  "config": [
    { id: "config.view", name: "Ver Configuración", module: "config", action: "view", description: "Acceder a configuraciones del sistema" },
    { id: "config.edit", name: "Editar Configuración", module: "config", action: "edit", description: "Modificar configuraciones del sistema" }
  ]
};

const moduleIcons: { [key: string]: any } = {
  "dashboard": BarChart,
  "users": Users,
  "services": Video,
  "equipment": Camera,
  "projects": FileText,
  "config": Settings
};

interface RoleFormProps {
  role?: Role;
  onSubmit: (data: RoleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RoleForm({ 
  role, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: RoleFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions.map(p => p.id) || []
  );

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RoleFormData>({
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions.map(p => p.id) || [],
      isActive: role?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    let newPermissions;
    if (checked) {
      newPermissions = [...selectedPermissions, permissionId];
    } else {
      newPermissions = selectedPermissions.filter(id => id !== permissionId);
    }
    
    setSelectedPermissions(newPermissions);
    setValue("permissions", newPermissions);
  };

  const handleModuleToggle = (module: string, checked: boolean) => {
    const modulePerms = modulePermissions[module].map(p => p.id);
    let newPermissions;
    
    if (checked) {
      // Agregar todos los permisos del módulo
      newPermissions = [...new Set([...selectedPermissions, ...modulePerms])];
    } else {
      // Remover todos los permisos del módulo
      newPermissions = selectedPermissions.filter(id => !modulePerms.includes(id));
    }
    
    setSelectedPermissions(newPermissions);
    setValue("permissions", newPermissions);
  };

  const isModuleChecked = (module: string) => {
    const modulePerms = modulePermissions[module].map(p => p.id);
    return modulePerms.every(id => selectedPermissions.includes(id));
  };

  const isModuleIndeterminate = (module: string) => {
    const modulePerms = modulePermissions[module].map(p => p.id);
    const checkedCount = modulePerms.filter(id => selectedPermissions.includes(id)).length;
    return checkedCount > 0 && checkedCount < modulePerms.length;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica del Rol */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Shield className="h-6 w-6 text-zinc-400" />
            Información del Rol
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="name" className="text-zinc-200 font-poppins font-medium text-base">
                Nombre del Rol *
              </Label>
              <Input
                id="name"
                placeholder="ej. Coordinador de Producción"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
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

          <div className="mt-8 space-y-4">
            <Label htmlFor="description" className="text-zinc-200 font-poppins font-medium text-base">
              Descripción
            </Label>
            <Textarea
              id="description"
              placeholder="Describe las responsabilidades y alcance de este rol..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("description")}
            />
          </div>
        </div>

        {/* Permisos por Módulo */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Settings className="h-6 w-6 text-zinc-400" />
            Permisos del Rol
          </h3>
          
          <div className="space-y-6">
            {Object.entries(modulePermissions).map(([module, permissions]) => {
              const IconComponent = moduleIcons[module];
              
              return (
                <div key={module} className="bg-zinc-700/30 rounded-lg p-6 border border-zinc-600/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-zinc-400" />
                      <h4 className="text-lg font-sora font-medium text-zinc-100 capitalize">
                        {module === 'dashboard' ? 'Dashboard' : 
                         module === 'users' ? 'Usuarios' :
                         module === 'services' ? 'Servicios' :
                         module === 'equipment' ? 'Equipos' :
                         module === 'projects' ? 'Proyectos' :
                         module === 'config' ? 'Configuración' : module}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Use a ref to set indeterminate state
                        const checkboxRef = (el: HTMLButtonElement | null) => {
                          if (el) {
                            const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
                            if (input) {
                              input.indeterminate = isModuleIndeterminate(module);
                            }
                          }
                        };
                        return (
                          <Checkbox
                            ref={checkboxRef}
                            checked={isModuleChecked(module)}
                            onCheckedChange={(checked) => handleModuleToggle(module, checked as boolean)}
                            className="border-zinc-500 data-[state=checked]:bg-zinc-600 data-[state=checked]:border-zinc-600"
                          />
                        );
                      })()}
                      <span className="text-sm text-zinc-400 font-poppins">Seleccionar todo</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-md">
                        <Checkbox
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                          className="border-zinc-500 data-[state=checked]:bg-zinc-600 data-[state=checked]:border-zinc-600 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-zinc-200 font-poppins">
                            {permission.name}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-zinc-500 font-poppins mt-1">
                              {permission.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen de permisos seleccionados */}
          {selectedPermissions.length > 0 && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <h4 className="text-blue-400 font-poppins font-medium mb-2">
                Resumen: {selectedPermissions.length} permisos seleccionados
              </h4>
              <div className="text-sm text-blue-300 font-poppins">
                Este rol tendrá acceso a las funcionalidades seleccionadas arriba.
              </div>
            </div>
          )}
        </div>

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
            {isLoading ? "Guardando..." : role ? "Actualizar Rol" : "Crear Rol"}
          </Button>
        </div>
      </form>
    </div>
  );
}