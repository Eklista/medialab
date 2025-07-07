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
import { Layers, Palette, ArrowUpDown, Info } from "lucide-react";

interface ServiceCategoryFormData {
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

interface ServiceCategoryFormProps {
  serviceCategory?: ServiceCategoryFormData & { id: string };
  onSubmit: (data: ServiceCategoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const predefinedColors = [
  { value: "#ef4444", name: "Rojo", usage: "Audiovisual y video" },
  { value: "#f59e0b", name: "Naranja", usage: "Diseño y creatividad" },
  { value: "#3b82f6", name: "Azul", usage: "Multimedia y tecnología" },
  { value: "#22c55e", name: "Verde", usage: "Eventos y actividades" },
  { value: "#8b5cf6", name: "Morado", usage: "Educación y formación" },
  { value: "#06b6d4", name: "Cian", usage: "Comunicación" },
  { value: "#ec4899", name: "Rosa", usage: "Marketing" },
  { value: "#6b7280", name: "Gris", usage: "Servicios generales" },
];

const categoryIcons = [
  "video", "camera", "film", "tv", "radio",
  "palette", "image", "edit", "paintbrush", "layers",
  "monitor", "smartphone", "laptop", "globe", "wifi",
  "calendar", "users", "star", "award", "trophy",
  "book", "graduation-cap", "file-text", "play-circle",
  "mic", "headphones", "volume-2", "settings"
];

const getCategoryExamples = () => [
  { 
    code: "AUDIOVISUAL", 
    name: "Audiovisual", 
    services: "Videos promocionales, grabación de clases, documentales, transmisiones",
    color: "#ef4444"
  },
  { 
    code: "DISENO", 
    name: "Diseño Gráfico", 
    services: "Flyers, banners, logos, infografías, material gráfico",
    color: "#f59e0b"
  },
  { 
    code: "MULTIMEDIA", 
    name: "Multimedia", 
    services: "Páginas web, aplicaciones móviles, presentaciones digitales",
    color: "#3b82f6"
  },
  { 
    code: "EVENTOS", 
    name: "Eventos", 
    services: "Cobertura de eventos, fotografía, streaming en vivo",
    color: "#22c55e"
  },
  { 
    code: "EDUCATIVO", 
    name: "Educativo", 
    services: "Cursos online, tutoriales, material didáctico, capacitaciones",
    color: "#8b5cf6"
  }
];

export default function ServiceCategoryForm({ 
  serviceCategory, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ServiceCategoryFormProps) {
  const [selectedColor, setSelectedColor] = useState(serviceCategory?.color || "#3b82f6");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ServiceCategoryFormData>({
    defaultValues: {
      code: serviceCategory?.code || "",
      name: serviceCategory?.name || "",
      description: serviceCategory?.description || "",
      color: serviceCategory?.color || "#3b82f6",
      icon: serviceCategory?.icon || "layers",
      sortOrder: serviceCategory?.sortOrder || 1,
      isActive: serviceCategory?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");
  const icon = watch("icon");

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue("color", color);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Layers className="h-6 w-6 text-zinc-400" />
            Configuración de Categoría de Servicio
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. AUDIOVISUAL, DISENO, MULTIMEDIA"
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
                Nombre de la Categoría *
              </Label>
              <Input
                id="name"
                placeholder="ej. Audiovisual, Diseño Gráfico, Multimedia"
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
                  {categoryIcons.map((iconName) => (
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

          <div className="mt-8 space-y-4">
            <Label htmlFor="description" className="text-zinc-200 font-poppins font-medium text-base">
              Descripción de la Categoría
            </Label>
            <Textarea
              id="description"
              placeholder="Describe qué tipos de servicios incluye esta categoría..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("description")}
            />
          </div>

          {/* Vista previa */}
          <div className="mt-8 p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/50">
            <Label className="text-zinc-200 font-poppins font-medium text-base mb-3 block">
              Vista Previa de la Categoría
            </Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg border border-zinc-400 flex items-center justify-center"
                style={{ backgroundColor: selectedColor }}
              >
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <div className="text-zinc-100 font-poppins font-medium text-lg">
                  {watch("name") || "Nombre de la Categoría"}
                </div>
                <div className="text-xs text-zinc-500 font-poppins">
                  {watch("code") || "CODIGO"} • Icono: {icon} • Orden: {watch("sortOrder") || 1}
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
                Color de la Categoría
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
                        className="w-6 h-6 rounded-lg border border-zinc-400"
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

        {/* Categorías Típicas del Sistema */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
          <h4 className="text-blue-400 font-poppins font-medium mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Categorías Típicas del Sistema
          </h4>
          <div className="space-y-4">
            {getCategoryExamples().map((example) => (
              <div key={example.code} className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded border border-blue-400 flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: example.color }}
                ></div>
                <div className="text-sm text-blue-300 font-poppins">
                  <span className="font-medium">{example.code}:</span> {example.name}
                  <div className="text-xs text-blue-400 mt-1">{example.services}</div>
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
            <p>• Las categorías agrupan tipos de servicios relacionados para mejor organización</p>
            <p>• Aparecen en el Portal Cliente como secciones principales de servicios</p>
            <p>• Los tipos de servicios se crean dentro de estas categorías</p>
            <p>• Los reportes pueden agrupar proyectos por categoría de servicio</p>
            <p>• El orden de visualización determina cómo aparecen en el portal</p>
          </div>
        </div>

        {/* Jerarquía del Sistema */}
        <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
          <h4 className="text-purple-400 font-poppins font-medium mb-3">
            🏗️ Jerarquía del Sistema
          </h4>
          <div className="text-sm text-purple-300 font-poppins space-y-2">
            <p><strong>1. Categorías de Servicio</strong> → Agrupan servicios similares (esta configuración)</p>
            <p><strong>2. Tipos de Servicio</strong> → Servicios específicos dentro de cada categoría</p>
            <p><strong>3. Proyectos</strong> → Instancias reales que solicitan los clientes</p>
            <p><strong>4. Tareas</strong> → Trabajo específico para completar cada proyecto</p>
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
            {isLoading ? "Guardando..." : serviceCategory ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}