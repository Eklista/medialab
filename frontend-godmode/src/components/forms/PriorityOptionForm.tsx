import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { AlertTriangle, Palette, ArrowUpDown, Info } from "lucide-react";

interface PriorityOptionFormData {
  code: string;
  name: string;
  level: number;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

interface PriorityOptionFormProps {
  priorityOption?: PriorityOptionFormData & { id: string };
  onSubmit: (data: PriorityOptionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const priorityColors = [
  { value: "#22c55e", name: "Verde", level: 1, usage: "Baja prioridad - sin urgencia" },
  { value: "#3b82f6", name: "Azul", level: 2, usage: "Normal - flujo estándar" },
  { value: "#f59e0b", name: "Naranja", level: 3, usage: "Alta - requiere atención" },
  { value: "#ef4444", name: "Rojo", level: 4, usage: "Urgente - atención inmediata" },
  { value: "#dc2626", name: "Rojo Oscuro", level: 5, usage: "Crítica - máxima prioridad" },
];

const priorityExamples = [
  { 
    code: "BAJA", 
    name: "Baja", 
    level: 1, 
    color: "#22c55e",
    description: "Proyectos sin fecha límite estricta, pueden esperar"
  },
  { 
    code: "NORMAL", 
    name: "Normal", 
    level: 2, 
    color: "#3b82f6",
    description: "Flujo de trabajo estándar, fecha límite normal"
  },
  { 
    code: "ALTA", 
    name: "Alta", 
    level: 3, 
    color: "#f59e0b",
    description: "Requiere atención prioritaria, fecha límite próxima"
  },
  { 
    code: "URGENTE", 
    name: "Urgente", 
    level: 4, 
    color: "#ef4444",
    description: "Atención inmediata, fecha límite muy próxima"
  },
  { 
    code: "CRITICA", 
    name: "Crítica", 
    level: 5, 
    color: "#dc2626",
    description: "Máxima prioridad, interrumpe otros trabajos"
  }
];

export default function PriorityOptionForm({ 
  priorityOption, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: PriorityOptionFormProps) {
  const [selectedColor, setSelectedColor] = useState(priorityOption?.color || "#3b82f6");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PriorityOptionFormData>({
    defaultValues: {
      code: priorityOption?.code || "",
      name: priorityOption?.name || "",
      level: priorityOption?.level || 2,
      color: priorityOption?.color || "#3b82f6",
      isActive: priorityOption?.isActive ?? true,
      sortOrder: priorityOption?.sortOrder || 1,
    }
  });

  const isActive = watch("isActive");
  const level = watch("level");

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue("color", color);
  };

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { label: "Nivel 1 - Baja", description: "Sin urgencia, puede esperar", color: "text-green-400" };
      case 2:
        return { label: "Nivel 2 - Normal", description: "Flujo estándar de trabajo", color: "text-blue-400" };
      case 3:
        return { label: "Nivel 3 - Alta", description: "Requiere atención prioritaria", color: "text-orange-400" };
      case 4:
        return { label: "Nivel 4 - Urgente", description: "Atención inmediata requerida", color: "text-red-400" };
      case 5:
        return { label: "Nivel 5 - Crítica", description: "Máxima prioridad del sistema", color: "text-red-600" };
      default:
        return { label: `Nivel ${level}`, description: "Nivel personalizado", color: "text-zinc-400" };
    }
  };

  const levelInfo = getLevelInfo(level);

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-zinc-400" />
            Configuración de Prioridad
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. BAJA, NORMAL, ALTA, URGENTE"
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
                Nombre de la Prioridad *
              </Label>
              <Input
                id="name"
                placeholder="ej. Baja, Normal, Alta, Urgente"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="level" className="text-zinc-200 font-poppins font-medium text-base">
                Nivel de Prioridad *
              </Label>
              <Select 
                value={level.toString()} 
                onValueChange={(value) => setValue("level", parseInt(value))}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    <div className={`text-left ${levelInfo.color}`}>
                      <div>{levelInfo.label}</div>
                      <div className="text-xs text-zinc-500">{levelInfo.description}</div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const info = getLevelInfo(lvl);
                    return (
                      <SelectItem key={lvl} value={lvl.toString()} className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                        <div className="text-left">
                          <div className={info.color}>{info.label}</div>
                          <div className="text-xs text-zinc-500">{info.description}</div>
                        </div>
                      </SelectItem>
                    );
                  })}
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

          {/* Vista previa */}
          <div className="mt-8 p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/50">
            <Label className="text-zinc-200 font-poppins font-medium text-base mb-3 block">
              Vista Previa de la Prioridad
            </Label>
            <div className="flex items-center gap-3">
              <AlertTriangle 
                className="h-6 w-6" 
                style={{ color: selectedColor }}
              />
              <div>
                <div className="text-zinc-100 font-poppins font-medium">
                  {watch("name") || "Nombre de la Prioridad"}
                </div>
                <div className="text-xs text-zinc-500 font-poppins">
                  {watch("code") || "CODIGO"} • {levelInfo.label}
                </div>
              </div>
              <div 
                className="ml-auto px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: selectedColor }}
              >
                Nivel {level}
              </div>
            </div>
          </div>
        </div>

        {/* Configuración Visual */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Palette className="h-6 w-6 text-zinc-400" />
            Color de la Prioridad
          </h3>
          
          <div className="space-y-6">
            <div>
              <Label className="text-zinc-200 font-poppins font-medium text-base mb-4 block">
                Colores Recomendados por Nivel
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priorityColors.map((color) => (
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
                      <AlertTriangle 
                        className="h-6 w-6" 
                        style={{ color: color.value }}
                      />
                      <span className="text-zinc-200 font-poppins font-medium">
                        {color.name}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 font-poppins">
                      <div className="font-medium">Nivel {color.level}</div>
                      <div>{color.usage}</div>
                    </div>
                  </button>
                ))}
              </div>
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

        {/* Prioridades Típicas del Sistema */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
          <h4 className="text-blue-400 font-poppins font-medium mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Prioridades Típicas del Sistema
          </h4>
          <div className="space-y-3">
            {priorityExamples.map((example) => (
              <div key={example.code} className="flex items-start gap-3">
                <AlertTriangle 
                  className="h-5 w-5 mt-0.5 flex-shrink-0" 
                  style={{ color: example.color }}
                />
                <div className="text-sm text-blue-300 font-poppins">
                  <span className="font-medium">{example.code}:</span> {example.name} (Nivel {example.level})
                  <div className="text-xs text-blue-400 mt-1">{example.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información de Uso */}
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6">
          <h4 className="text-green-400 font-poppins font-medium mb-3">
            💡 Cómo se Usa en el Sistema
          </h4>
          <div className="text-sm text-green-300 font-poppins space-y-2">
            <p>• Las prioridades se asignan a proyectos y tareas para ordenar el trabajo</p>
            <p>• Los colaboradores ven sus tareas ordenadas por prioridad en el Dashboard</p>
            <p>• Los administradores pueden filtrar y reportar por nivel de prioridad</p>
            <p>• Las notificaciones pueden variar según la prioridad del elemento</p>
            <p>• Los niveles más altos (4-5) pueden generar alertas automáticas</p>
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
            {isLoading ? "Guardando..." : priorityOption ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}