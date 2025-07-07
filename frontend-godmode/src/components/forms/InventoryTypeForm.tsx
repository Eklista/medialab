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
import { Package, Palette, Info } from "lucide-react";

interface InventoryTypeFormData {
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

interface InventoryTypeFormProps {
  inventoryType?: InventoryTypeFormData & { id: string };
  onSubmit: (data: InventoryTypeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const predefinedColors = [
  { value: "#ef4444", name: "Rojo", usage: "Cámaras y video" },
  { value: "#8b5cf6", name: "Morado", usage: "Audio y sonido" },
  { value: "#f59e0b", name: "Naranja", usage: "Iluminación" },
  { value: "#3b82f6", name: "Azul", usage: "Computadoras" },
  { value: "#6b7280", name: "Gris", usage: "Accesorios" },
  { value: "#22c55e", name: "Verde", usage: "Otros equipos" },
  { value: "#06b6d4", name: "Cian", usage: "Equipos móviles" },
  { value: "#ec4899", name: "Rosa", usage: "Equipos especiales" },
];

const inventoryIcons = [
  "camera", "video", "film", "aperture",
  "mic", "headphones", "volume-2", "radio",
  "lightbulb", "zap", "sun", "flashlight",
  "monitor", "laptop", "smartphone", "tablet",
  "tool", "settings", "wrench", "scissors",
  "package", "box", "archive", "briefcase"
];

const getInventoryExamples = () => [
  { code: "CAMARA", name: "Cámaras", examples: "Cámaras de video, DSLR, cámaras de acción" },
  { code: "AUDIO", name: "Audio", examples: "Micrófonos, audífonos, grabadoras, amplificadores" },
  { code: "ILUMINACION", name: "Iluminación", examples: "Luces LED, reflectores, trípodes de luz" },
  { code: "COMPUTADORA", name: "Computadoras", examples: "PCs, laptops, tablets, monitores" },
  { code: "ACCESORIO", name: "Accesorios", examples: "Trípodes, cables, baterías, memorias" },
];

export default function InventoryTypeForm({ 
  inventoryType, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: InventoryTypeFormProps) {
  const [selectedColor, setSelectedColor] = useState(inventoryType?.color || "#3b82f6");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<InventoryTypeFormData>({
    defaultValues: {
      code: inventoryType?.code || "",
      name: inventoryType?.name || "",
      description: inventoryType?.description || "",
      color: inventoryType?.color || "#3b82f6",
      icon: inventoryType?.icon || "camera",
      isActive: inventoryType?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");
  const icon = watch("icon");

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue("color", color);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Package className="h-6 w-6 text-zinc-400" />
            Configuración de Tipo de Inventario
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. CAMARA, AUDIO, ILUMINACION"
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
                placeholder="ej. Cámaras, Audio, Iluminación"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="icon" className="text-zinc-200 font-poppins font-medium text-base">
                Icono Representativo *
              </Label>
              <Select 
                value={icon} 
                onValueChange={(value) => setValue("icon", value)}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    <span>{icon}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins max-h-60">
                  {inventoryIcons.map((iconName) => (
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
              Descripción del Tipo
            </Label>
            <Textarea
              id="description"
              placeholder="Describe qué tipo de equipos incluye esta categoría..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("description")}
            />
          </div>

          {/* Vista previa */}
          <div className="mt-8 p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/50">
            <Label className="text-zinc-200 font-poppins font-medium text-base mb-3 block">
              Vista Previa
            </Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg border border-zinc-400 flex items-center justify-center"
                style={{ backgroundColor: selectedColor }}
              >
                <span className="text-white text-lg">📦</span>
              </div>
              <div>
                <div className="text-zinc-100 font-poppins font-medium">
                  {watch("name") || "Nombre del Tipo"}
                </div>
                <div className="text-xs text-zinc-500 font-poppins">
                  {watch("code") || "CODIGO"} • Icono: {icon}
                </div>
              </div>
            </div>
          </div>
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
                Color del Tipo de Inventario
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

        {/* Tipos Típicos del Sistema */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
          <h4 className="text-blue-400 font-poppins font-medium mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Tipos Típicos de Inventario
          </h4>
          <div className="space-y-3">
            {getInventoryExamples().map((example) => (
              <div key={example.code} className="text-sm text-blue-300 font-poppins">
                <span className="font-medium">{example.code}:</span> {example.name} - 
                <span className="text-blue-400"> {example.examples}</span>
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
            <p>• Los tipos de inventario agrupan equipos similares para mejor organización</p>
            <p>• Aparecen en el Dashboard cuando se crean equipos individuales</p>
            <p>• Los colaboradores pueden filtrar equipos por tipo al hacer reservas</p>
            <p>• Los reportes de inventario se organizan por estos tipos</p>
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
            {isLoading ? "Guardando..." : inventoryType ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}