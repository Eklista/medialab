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
import { Video, Palette, Building2, Info } from "lucide-react";

interface ServiceTypeFormData {
  categoryId: string;
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

interface ServiceCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface ServiceTypeFormProps {
  serviceType?: ServiceTypeFormData & { id: string };
  onSubmit: (data: ServiceTypeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Categorías de servicio predefinidas
const mockServiceCategories: ServiceCategory[] = [
  { 
    id: "1", 
    code: "AUDIOVISUAL", 
    name: "Audiovisual", 
    description: "Servicios de video, audio y transmisión",
    color: "#ef4444",
    icon: "video"
  },
  { 
    id: "2", 
    code: "DISENO", 
    name: "Diseño Gráfico", 
    description: "Servicios de diseño y creatividad visual",
    color: "#f59e0b",
    icon: "palette"
  },
  { 
    id: "3", 
    code: "MULTIMEDIA", 
    name: "Multimedia", 
    description: "Servicios digitales y tecnológicos",
    color: "#3b82f6",
    icon: "monitor"
  },
  { 
    id: "4", 
    code: "EVENTOS", 
    name: "Eventos", 
    description: "Servicios para eventos y ceremonias",
    color: "#22c55e",
    icon: "calendar"
  },
  { 
    id: "5", 
    code: "EDUCATIVO", 
    name: "Educativo", 
    description: "Servicios para formación y educación",
    color: "#8b5cf6",
    icon: "book"
  }
];

const predefinedColors = [
  { value: "#ef4444", name: "Rojo", category: "Audiovisual" },
  { value: "#f59e0b", name: "Naranja", category: "Diseño" },
  { value: "#3b82f6", name: "Azul", category: "Multimedia" },
  { value: "#22c55e", name: "Verde", category: "Eventos" },
  { value: "#8b5cf6", name: "Morado", category: "Educativo" },
  { value: "#06b6d4", name: "Cian", category: "Técnico" },
  { value: "#ec4899", name: "Rosa", category: "Marketing" },
  { value: "#6b7280", name: "Gris", category: "General" },
];

const commonIcons = [
  "video", "camera", "mic", "headphones", "film", "tv",
  "palette", "image", "edit", "paintbrush", "layers",
  "monitor", "smartphone", "laptop", "globe", "wifi",
  "calendar", "users", "star", "award", "trophy",
  "book", "graduation-cap", "file-text", "play-circle"
];

const getServiceExamples = (categoryCode: string) => {
  switch (categoryCode) {
    case "AUDIOVISUAL":
      return "VIDEO_PROMOCIONAL, PODCAST, GRABACION_CLASE, DOCUMENTAL, TRANSMISION_VIVO";
    case "DISENO":
      return "FLYER, BANNER, LOGO, INFOGRAFIA, MATERIAL_GRAFICO";
    case "MULTIMEDIA":
      return "PAGINA_WEB, APP_MOVIL, PRESENTACION, CONTENIDO_DIGITAL";
    case "EVENTOS":
      return "COBERTURA_EVENTO, FOTOGRAFIA, STREAMING, CEREMONIAS";
    case "EDUCATIVO":
      return "CURSO_ONLINE, TUTORIAL, MATERIAL_DIDACTICO, CAPACITACION";
    default:
      return "Servicios específicos de la categoría";
  }
};

export default function ServiceTypeForm({ 
  serviceType, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ServiceTypeFormProps) {
  const [selectedColor, setSelectedColor] = useState(serviceType?.color || "#3b82f6");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ServiceTypeFormData>({
    defaultValues: {
      categoryId: serviceType?.categoryId || "",
      code: serviceType?.code || "",
      name: serviceType?.name || "",
      description: serviceType?.description || "",
      color: serviceType?.color || "#3b82f6",
      icon: serviceType?.icon || "video",
      sortOrder: serviceType?.sortOrder || 1,
      isActive: serviceType?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");
  const categoryId = watch("categoryId");
  const icon = watch("icon");
  const selectedCategory = mockServiceCategories.find(cat => cat.id === categoryId);

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
            <Video className="h-6 w-6 text-zinc-400" />
            Configuración de Tipo de Servicio
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="categoryId" className="text-zinc-200 font-poppins font-medium text-base">
                Categoría de Servicio *
              </Label>
              <Select 
                value={categoryId} 
                onValueChange={(value) => setValue("categoryId", value)}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    {selectedCategory ? (
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border border-zinc-400"
                          style={{ backgroundColor: selectedCategory.color }}
                        ></div>
                        <div className="text-left">
                          <div>{selectedCategory.name}</div>
                          <div className="text-xs text-zinc-500">{selectedCategory.description}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Selecciona una categoría</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  {mockServiceCategories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border border-zinc-400"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div className="text-left">
                          <div>{category.name}</div>
                          <div className="text-xs text-zinc-500">{category.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-red-400 text-sm font-poppins">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. VIDEO_PROMOCIONAL, PODCAST, LOGO"
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
                Nombre del Servicio *
              </Label>
              <Input
                id="name"
                placeholder="ej. Video Promocional, Podcast, Diseño de Logo"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="sortOrder" className="text-zinc-200 font-poppins font-medium text-base">
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
              Descripción del Servicio
            </Label>
            <Textarea
              id="description"
              placeholder="Describe el tipo de servicio, qué incluye y para qué se usa..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("description")}
            />
          </div>

          {/* Vista previa */}
          <div className="mt-8 p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/50">
            <Label className="text-zinc-200 font-poppins font-medium text-base mb-3 block">
              Vista Previa del Servicio
            </Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-lg border border-zinc-400 flex items-center justify-center"
                style={{ backgroundColor: selectedColor }}
              >
                <span className="text-xs text-white">📄</span>
              </div>
              <div>
                <div className="text-zinc-100 font-poppins font-medium">
                  {watch("name") || "Nombre del Servicio"}
                </div>
                <div className="text-xs text-zinc-500 font-poppins">
                  {selectedCategory?.name} • {watch("code") || "CODIGO"}
                </div>
              </div>
            </div>
          </div>

          {/* Ejemplos para la categoría seleccionada */}
          {selectedCategory && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-300 font-poppins">
                  <p><strong>Ejemplos para {selectedCategory.name}:</strong></p>
                  <p className="text-xs mt-1">{getServiceExamples(selectedCategory.code)}</p>
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
                Color del Servicio
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
                      Para {color.category}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="icon" className="text-zinc-200 font-poppins font-medium text-base">
                  Icono del Servicio
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
        </div>

        {/* Jerarquía de Servicios */}
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6">
          <h4 className="text-green-400 font-poppins font-medium mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Jerarquía del Sistema
          </h4>
          <div className="text-sm text-green-300 font-poppins space-y-2">
            <p><strong>Categorías de Servicio:</strong> Agrupan tipos relacionados (ej. Audiovisual, Diseño)</p>
            <p><strong>Tipos de Servicio:</strong> Servicios específicos que pueden solicitar los clientes</p>
            <p><strong>Portal Cliente:</strong> Los clientes verán estos tipos organizados por categoría</p>
            <p><strong>Gestión de Proyectos:</strong> Cada proyecto tendrá asignado un tipo de servicio</p>
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
            {isLoading ? "Guardando..." : serviceType ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}