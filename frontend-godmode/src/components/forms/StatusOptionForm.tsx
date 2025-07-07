import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
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
import { Settings, Palette, ArrowUpDown, Info } from "lucide-react";

interface StatusOptionFormData {
  statusTypeId: string;
  code: string;
  name: string;
  level: number;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

interface StatusType {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface StatusOptionFormProps {
  statusOption?: StatusOptionFormData & { id: string };
  onSubmit: (data: StatusOptionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Tipos de estado del sistema
const mockStatusTypes: StatusType[] = [
  { id: "1", code: "TASKS", name: "Estados de Tareas", description: "Estados del flujo de trabajo de tareas" },
  { id: "2", code: "PROJECTS", name: "Estados de Proyectos", description: "Estados del ciclo de vida de proyectos" },
  { id: "3", code: "INVENTORY", name: "Estados de Inventario", description: "Estados de equipos y suministros" },
  { id: "4", code: "REQUESTS", name: "Estados de Solicitudes", description: "Estados de solicitudes de clientes" },
  { id: "5", code: "PODCASTS", name: "Estados de Podcasts", description: "Estados de episodios de podcast" },
  { id: "6", code: "CLASSES", name: "Estados de Clases", description: "Estados de grabación de clases" },
  { id: "7", code: "TASK_ASSIGNMENTS", name: "Estados de Asignaciones", description: "Estados de asignaciones de tareas" },
  { id: "8", code: "TASK_APPROVALS", name: "Estados de Aprobaciones", description: "Estados de aprobaciones de tareas" },
  { id: "9", code: "DELIVERABLES", name: "Estados de Entregables", description: "Estados de entregables de tareas" },
  { id: "10", code: "SUPPLIES", name: "Estados de Suministros", description: "Estados de suministros del inventario" }
];

const predefinedColors = [
  { value: "#6b7280", name: "Gris", usage: "Pendiente, inicial" },
  { value: "#f59e0b", name: "Naranja", usage: "En progreso, advertencia" },
  { value: "#3b82f6", name: "Azul", usage: "En proceso, información" },
  { value: "#8b5cf6", name: "Morado", usage: "En revisión, especial" },
  { value: "#22c55e", name: "Verde", usage: "Aprobado, éxito" },
  { value: "#ef4444", name: "Rojo", usage: "Rechazado, error" },
  { value: "#06b6d4", name: "Cian", usage: "Cliente, externo" },
  { value: "#10b981", name: "Verde Oscuro", usage: "Completado, final" },
];

const commonIcons = [
  "clock", "play", "pause", "check", "x", "alert-triangle", 
  "eye", "edit", "trash", "settings", "user", "users",
  "folder", "file", "upload", "download", "star", "heart"
];

export default function StatusOptionForm({ 
  statusOption, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: StatusOptionFormProps) {
  const [selectedColor, setSelectedColor] = useState(statusOption?.color || "#3b82f6");
  const [selectedStatusType, setSelectedStatusType] = useState<StatusType | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StatusOptionFormData>({
    defaultValues: {
      statusTypeId: statusOption?.statusTypeId || "",
      code: statusOption?.code || "",
      name: statusOption?.name || "",
      level: statusOption?.level || 1,
      color: statusOption?.color || "#3b82f6",
      icon: statusOption?.icon || "circle",
      isActive: statusOption?.isActive ?? true,
      sortOrder: statusOption?.sortOrder || 1,
    }
  });

  const isActive = watch("isActive");
  const statusTypeId = watch("statusTypeId");
  const level = watch("level");
  const icon = watch("icon");

  useEffect(() => {
    const type = mockStatusTypes.find(t => t.id === statusTypeId);
    setSelectedStatusType(type || null);
  }, [statusTypeId]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue("color", color);
  };

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { label: "Nivel 1 - Ejecución", description: "Estados operativos principales", color: "text-blue-400" };
      case 2:
        return { label: "Nivel 2 - Revisión", description: "Estados de validación interna", color: "text-purple-400" };
      case 3:
        return { label: "Nivel 3 - Cliente", description: "Estados de aprobación del cliente", color: "text-green-400" };
      default:
        return { label: `Nivel ${level}`, description: "Nivel personalizado", color: "text-zinc-400" };
    }
  };

  const getStatusTypeExamples = (code: string) => {
    switch (code) {
      case "TASKS":
        return "PENDIENTE, EN_PROGRESO, ENTREGADO, EN_REVISION, APROBADO, RECHAZADO, COMPLETADO";
      case "PROJECTS":
        return "SOLICITADO, PLANIFICACION, EN_PROGRESO, COMPLETADO, EN_PAUSA, CANCELADO";
      case "INVENTORY":
        return "DISPONIBLE, EN_USO, RESERVADO, MANTENIMIENTO, REPARACION, RETIRADO";
      case "REQUESTS":
        return "ENVIADO, EN_EVALUACION, APROBADO, RECHAZADO, MAS_INFORMACION";
      default:
        return "Estados específicos del tipo seleccionado";
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Settings className="h-6 w-6 text-zinc-400" />
            Configuración de Estado
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="statusTypeId" className="text-zinc-200 font-poppins font-medium text-base">
                Tipo de Estado *
              </Label>
              <Select 
                value={statusTypeId} 
                onValueChange={(value) => setValue("statusTypeId", value)}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    {selectedStatusType ? (
                      <div className="text-left">
                        <div>{selectedStatusType.name}</div>
                        <div className="text-xs text-zinc-500">{selectedStatusType.description}</div>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Selecciona un tipo de estado</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  {mockStatusTypes.map((type) => (
                    <SelectItem 
                      key={type.id} 
                      value={type.id}
                      className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                    >
                      <div className="text-left">
                        <div>{type.name}</div>
                        <div className="text-xs text-zinc-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.statusTypeId && (
                <p className="text-red-400 text-sm font-poppins">{errors.statusTypeId.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. EN_PROGRESO, APROBADO, RECHAZADO"
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
                Nombre del Estado *
              </Label>
              <Input
                id="name"
                placeholder="ej. En Progreso, Aprobado, Rechazado"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="level" className="text-zinc-200 font-poppins font-medium text-base">
                Nivel en el Flujo *
              </Label>
              <Select 
                value={level.toString()} 
                onValueChange={(value) => setValue("level", parseInt(value))}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    <div className={`text-left ${getLevelInfo(level).color}`}>
                      <div>{getLevelInfo(level).label}</div>
                      <div className="text-xs text-zinc-500">{getLevelInfo(level).description}</div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  <SelectItem value="1" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="text-left">
                      <div className="text-blue-400">Nivel 1 - Ejecución</div>
                      <div className="text-xs text-zinc-500">Estados operativos principales</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="2" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="text-left">
                      <div className="text-purple-400">Nivel 2 - Revisión</div>
                      <div className="text-xs text-zinc-500">Estados de validación interna</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="3" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="text-left">
                      <div className="text-green-400">Nivel 3 - Cliente</div>
                      <div className="text-xs text-zinc-500">Estados de aprobación del cliente</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label htmlFor="sortOrder" className="text-zinc-200 font-poppins font-medium text-base flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Orden de Visualización
              </Label>
              <Input
                id="sortOrder"
                type="number"
                min="1"
                placeholder="ej. 1, 2, 3..."
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("sortOrder", { 
                  required: "El orden es requerido",
                  valueAsNumber: true,
                  min: { value: 1, message: "El orden debe ser mayor a 0" }
                })}
              />
              {errors.sortOrder && (
                <p className="text-red-400 text-sm font-poppins">{errors.sortOrder.message}</p>
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

          {/* Vista previa del estado */}
          <div className="mt-8 p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/50">
            <Label className="text-zinc-200 font-poppins font-medium text-base mb-3 block">
              Vista Previa
            </Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border border-zinc-400"
                style={{ backgroundColor: selectedColor }}
              ></div>
              <span className="text-zinc-100 font-poppins">
                {watch("name") || "Nombre del Estado"}
              </span>
              <span className="text-xs text-zinc-500 font-poppins px-2 py-1 bg-zinc-800/50 rounded">
                {watch("code") || "CODIGO"}
              </span>
              <span className={`text-xs font-poppins px-2 py-1 rounded ${getLevelInfo(level).color.replace('text-', 'bg-').replace('-400', '-900/50')}`}>
                {getLevelInfo(level).label}
              </span>
            </div>
          </div>

          {/* Ejemplos para el tipo seleccionado */}
          {selectedStatusType && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-300 font-poppins">
                  <p><strong>Ejemplos para {selectedStatusType.name}:</strong></p>
                  <p className="text-xs mt-1">{getStatusTypeExamples(selectedStatusType.code)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuración Visual */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Palette className="h-6 w-6 text-zinc-400" />
            Configuración Visual
          </h3>
          
          <div className="space-y-6">
            <div>
              <Label className="text-zinc-200 font-poppins font-medium text-base mb-4 block">
                Color del Estado
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {predefinedColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorSelect(color.value)}
                    className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                      selectedColor === color.value
                        ? "border-zinc-400 bg-zinc-700/50"
                        : "border-zinc-600 bg-zinc-800/50 hover:bg-zinc-700/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full border border-zinc-400"
                        style={{ backgroundColor: color.value }}
                      ></div>
                      <span className="text-zinc-200 font-poppins font-medium">
                        {color.name}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-poppins">
                      {color.usage}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="icon" className="text-zinc-200 font-poppins font-medium text-base">
                Icono (Opcional)
              </Label>
              <Select 
                value={icon} 
                onValueChange={(value) => setValue("icon", value)}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    <span>{icon || "Sin icono"}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  <SelectItem value="" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    Sin icono
                  </SelectItem>
                  {commonIcons.map((iconName) => (
                    <SelectItem 
                      key={iconName} 
                      value={iconName}
                      className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                    >
                      {iconName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-200 font-poppins font-medium text-base">
                Color Personalizado
              </Label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-16 h-12 rounded-lg border border-zinc-600 bg-transparent cursor-pointer"
                />
                <Input
                  value={selectedColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  placeholder="#3b82f6"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins max-w-[150px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Información sobre el flujo de 3 niveles */}
        <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
          <h4 className="text-purple-400 font-poppins font-medium mb-3">
            🔄 Sistema de Flujo de 3 Niveles
          </h4>
          <div className="text-sm text-purple-300 font-poppins space-y-2">
            <p><strong>Nivel 1 - Ejecución:</strong> Estados donde colaboradores trabajan (PENDIENTE, EN_PROGRESO, ENTREGADO)</p>
            <p><strong>Nivel 2 - Revisión:</strong> Estados de validación interna por admins (EN_REVISION, APROBADO, RECHAZADO)</p>
            <p><strong>Nivel 3 - Cliente:</strong> Estados donde el cliente valida (REVISION_CLIENTE, APROBADO_CLIENTE, COMPLETADO)</p>
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
            {isLoading ? "Guardando..." : statusOption ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}