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
import { Briefcase, Palette, Eye } from "lucide-react";

interface EmployeeRoleFormData {
  code: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}

interface EmployeeRoleFormProps {
  employeeRole?: EmployeeRoleFormData & { id: string };
  onSubmit: (data: EmployeeRoleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const predefinedColors = [
  { value: "#ef4444", name: "Rojo", example: "Para roles críticos como Camarógrafo" },
  { value: "#3b82f6", name: "Azul", example: "Para roles técnicos como Editor" },
  { value: "#f59e0b", name: "Naranja", example: "Para roles creativos como Diseñador" },
  { value: "#22c55e", name: "Verde", example: "Para roles de coordinación" },
  { value: "#8b5cf6", name: "Morado", example: "Para roles especializados" },
  { value: "#6b7280", name: "Gris", example: "Para roles de apoyo" },
  { value: "#ec4899", name: "Rosa", example: "Para roles administrativos" },
  { value: "#06b6d4", name: "Cian", example: "Para roles de producción" },
];

export default function EmployeeRoleForm({ 
  employeeRole, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: EmployeeRoleFormProps) {
  const [selectedColor, setSelectedColor] = useState(employeeRole?.color || "#3b82f6");
  const [customColor, setCustomColor] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmployeeRoleFormData>({
    defaultValues: {
      code: employeeRole?.code || "",
      name: employeeRole?.name || "",
      description: employeeRole?.description || "",
      color: employeeRole?.color || "#3b82f6",
      isActive: employeeRole?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue("color", color);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    if (color) {
      setSelectedColor(color);
      setValue("color", color);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-zinc-400" />
            Configuración de Rol de Empleado
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. CAMAROGRAFO, EDITOR, DISEÑADOR"
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
                Nombre del Rol *
              </Label>
              <Input
                id="name"
                placeholder="ej. Camarógrafo, Editor de Video, Diseñador Gráfico"
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

            <div className="space-y-4">
              <Label className="text-zinc-200 font-poppins font-medium text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vista Previa
              </Label>
              <div className="bg-zinc-700/50 border border-zinc-600 rounded-lg p-4 h-12 flex items-center">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-zinc-400"
                    style={{ backgroundColor: selectedColor }}
                  ></div>
                  <span className="text-zinc-100 font-poppins">
                    {watch("name") || "Nombre del Rol"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <Label htmlFor="description" className="text-zinc-200 font-poppins font-medium text-base">
              Descripción
            </Label>
            <Textarea
              id="description"
              placeholder="Describe las responsabilidades y funciones de este rol..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("description")}
            />
          </div>
        </div>

        {/* Selección de Color */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Palette className="h-6 w-6 text-zinc-400" />
            Color Representativo
          </h3>
          
          <div className="space-y-6">
            <div>
              <Label className="text-zinc-200 font-poppins font-medium text-base mb-4 block">
                Colores Predefinidos
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
                      {color.example}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-200 font-poppins font-medium text-base">
                Color Personalizado
              </Label>
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <input
                    type="color"
                    value={customColor || selectedColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-16 h-12 rounded-lg border border-zinc-600 bg-transparent cursor-pointer"
                  />
                </div>
                <Input
                  value={customColor || selectedColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#3b82f6"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins max-w-[150px]"
                />
                <div className="text-sm text-zinc-400 font-poppins">
                  Formato hexadecimal
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Predefinidos del Sistema */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
          <h4 className="text-blue-400 font-poppins font-medium mb-3">
            💡 Roles Típicos del Sistema
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-300 font-poppins">
            <div>• <strong>CAMAROGRAFO:</strong> Grabación y captura de video</div>
            <div>• <strong>EDITOR:</strong> Edición y post-producción</div>
            <div>• <strong>DISEÑADOR:</strong> Diseño gráfico y creatividad</div>
            <div>• <strong>COORDINADOR:</strong> Gestión y organización</div>
            <div>• <strong>TECNICO:</strong> Soporte técnico y mantenimiento</div>
            <div>• <strong>ASISTENTE:</strong> Apoyo general y logística</div>
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
            {isLoading ? "Guardando..." : employeeRole ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}