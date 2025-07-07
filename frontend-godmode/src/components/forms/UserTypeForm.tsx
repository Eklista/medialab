import { useForm } from "react-hook-form";
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
import { Shield, Info } from "lucide-react";

interface UserTypeFormData {
  code: string;
  name: string;
  description: string;
  dashboardType: "PORTAL" | "DASHBOARD" | "GODMODE";
  permissions: Record<string, any>;
  isActive: boolean;
}

interface UserTypeFormProps {
  userType?: UserTypeFormData & { id: string };
  onSubmit: (data: UserTypeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UserTypeForm({ 
  userType, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: UserTypeFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UserTypeFormData>({
    defaultValues: {
      code: userType?.code || "",
      name: userType?.name || "",
      description: userType?.description || "",
      dashboardType: userType?.dashboardType || "DASHBOARD",
      isActive: userType?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");
  const dashboardType = watch("dashboardType");

  const getDashboardTypeInfo = (type: string) => {
    switch (type) {
      case "PORTAL":
        return { 
          label: "Portal Cliente", 
          description: "Acceso al portal externo (/portal/)",
          color: "text-blue-400",
          example: "Para clientes que solicitan servicios"
        };
      case "DASHBOARD":
        return { 
          label: "Dashboard Interno", 
          description: "Acceso al dashboard interno (/dashboard/)",
          color: "text-green-400",
          example: "Para colaboradores y administradores"
        };
      case "GODMODE":
        return { 
          label: "God Mode", 
          description: "Acceso completo al sistema (/godmode/)",
          color: "text-purple-400",
          example: "Para súper administradores"
        };
      default:
        return { label: type, description: "", color: "text-zinc-400", example: "" };
    }
  };

  const selectedDashboardInfo = getDashboardTypeInfo(dashboardType);

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Shield className="h-6 w-6 text-zinc-400" />
            Configuración de Tipo de Usuario
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. CLIENT, ADMIN, COLLABORATOR"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins uppercase"
                {...register("code", { 
                  required: "El código es requerido",
                  pattern: {
                    value: /^[A-Z_]+$/,
                    message: "Solo letras mayúsculas y guiones bajos"
                  }
                })}
                onChange={(e) => e.target.value = e.target.value.toUpperCase()}
              />
              {errors.code && (
                <p className="text-red-400 text-sm font-poppins">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="name" className="text-zinc-200 font-poppins font-medium text-base">
                Nombre del Tipo *
              </Label>
              <Input
                id="name"
                placeholder="ej. Cliente, Administrador, Colaborador"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-200 font-poppins font-medium text-base">
                Tipo de Dashboard *
              </Label>
              <Select 
                value={dashboardType} 
                onValueChange={(value) => setValue("dashboardType", value as any)}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        dashboardType === 'GODMODE' ? 'bg-purple-500' :
                        dashboardType === 'DASHBOARD' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}></div>
                      <span className={selectedDashboardInfo.color}>{selectedDashboardInfo.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  <SelectItem value="PORTAL" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <div>Portal Cliente</div>
                        <div className="text-xs text-zinc-500">Acceso externo (/portal/)</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="DASHBOARD" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div>Dashboard Interno</div>
                        <div className="text-xs text-zinc-500">Acceso interno (/dashboard/)</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="GODMODE" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <div>
                        <div>God Mode</div>
                        <div className="text-xs text-zinc-500">Súper administración (/godmode/)</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
              placeholder="Describe el rol y responsabilidades de este tipo de usuario..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("description")}
            />
          </div>

          {/* Info del tipo seleccionado */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300 font-poppins">
                <p><strong>Acceso:</strong> {selectedDashboardInfo.description}</p>
                <p><strong>Ejemplo de uso:</strong> {selectedDashboardInfo.example}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de Códigos Predefinidos */}
        <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-6">
          <h4 className="text-orange-400 font-poppins font-medium mb-3">
            ⚠️ Códigos del Sistema
          </h4>
          <div className="text-sm text-orange-300 font-poppins space-y-2">
            <p><strong>CLIENT:</strong> Portal externo para solicitar servicios</p>
            <p><strong>COLLABORATOR:</strong> Dashboard interno para ejecutar tareas</p>
            <p><strong>ADMIN:</strong> Dashboard interno para gestionar proyectos</p>
            <p><strong>SUPERADMIN:</strong> God Mode para configurar el sistema</p>
          </div>
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
            {isLoading ? "Guardando..." : userType ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}