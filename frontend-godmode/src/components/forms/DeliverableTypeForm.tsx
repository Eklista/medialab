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
import { FileText, Palette, Plus, X, Info } from "lucide-react";

interface DeliverableTypeFormData {
  code: string;
  name: string;
  description: string;
  fileExtensions: string[];
  color: string;
  icon: string;
  isActive: boolean;
}

interface DeliverableTypeFormProps {
  deliverableType?: DeliverableTypeFormData & { id: string };
  onSubmit: (data: DeliverableTypeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const predefinedColors = [
  { value: "#ef4444", name: "Rojo", usage: "Video y multimedia" },
  { value: "#8b5cf6", name: "Morado", usage: "Audio y sonido" },
  { value: "#06b6d4", name: "Cian", usage: "Imágenes y gráficos" },
  { value: "#22c55e", name: "Verde", usage: "Documentos" },
  { value: "#f59e0b", name: "Naranja", usage: "Diseño y creatividad" },
  { value: "#6b7280", name: "Gris", usage: "Código y desarrollo" },
  { value: "#ec4899", name: "Rosa", usage: "Presentaciones" },
  { value: "#3b82f6", name: "Azul", usage: "General" },
];

const deliverableIcons = [
  "file-video", "video", "play", "film",
  "file-audio", "headphones", "volume-2", "music",
  "file-image", "image", "camera", "picture-in-picture",
  "file-text", "file", "document", "file-check",
  "palette", "edit", "paintbrush", "layers",
  "code", "terminal", "archive", "package"
];

const commonExtensions = {
  "VIDEO": ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm"],
  "AUDIO": ["mp3", "wav", "m4a", "aac", "flac", "ogg", "wma"],
  "IMAGEN": ["jpg", "jpeg", "png", "gif", "svg", "bmp", "webp", "tiff"],
  "DOCUMENTO": ["pdf", "doc", "docx", "txt", "rtf", "odt"],
  "DISENO": ["psd", "ai", "fig", "sketch", "xd", "indd", "eps"],
  "CODIGO": ["zip", "rar", "tar", "gz", "git", "js", "ts", "css", "html"]
};

const getDeliverableExamples = () => [
  { 
    code: "VIDEO", 
    name: "Video", 
    extensions: "mp4, mov, avi", 
    usage: "Videos promocionales, clases grabadas, documentales" 
  },
  { 
    code: "AUDIO", 
    name: "Audio", 
    extensions: "mp3, wav, m4a", 
    usage: "Podcasts, grabaciones, música, efectos" 
  },
  { 
    code: "IMAGEN", 
    name: "Imagen", 
    extensions: "jpg, png, svg", 
    usage: "Fotografías, ilustraciones, gráficos" 
  },
  { 
    code: "DOCUMENTO", 
    name: "Documento", 
    extensions: "pdf, docx", 
    usage: "Informes, guiones, manuales, presentaciones" 
  },
  { 
    code: "DISENO", 
    name: "Diseño", 
    extensions: "psd, ai, fig", 
    usage: "Logos, flyers, banners, mockups" 
  },
  { 
    code: "CODIGO", 
    name: "Código", 
    extensions: "zip, git", 
    usage: "Páginas web, aplicaciones, archivos comprimidos" 
  }
];

export default function DeliverableTypeForm({ 
  deliverableType, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: DeliverableTypeFormProps) {
  const [selectedColor, setSelectedColor] = useState(deliverableType?.color || "#3b82f6");
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>(
    deliverableType?.fileExtensions || []
  );
  const [newExtension, setNewExtension] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DeliverableTypeFormData>({
    defaultValues: {
      code: deliverableType?.code || "",
      name: deliverableType?.name || "",
      description: deliverableType?.description || "",
      fileExtensions: deliverableType?.fileExtensions || [],
      color: deliverableType?.color || "#3b82f6",
      icon: deliverableType?.icon || "file",
      isActive: deliverableType?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");
  const icon = watch("icon");
  const code = watch("code");

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue("color", color);
  };

  const addExtension = (extension: string) => {
    const cleanExt = extension.toLowerCase().replace(".", "");
    if (cleanExt && !selectedExtensions.includes(cleanExt)) {
      const updatedExtensions = [...selectedExtensions, cleanExt];
      setSelectedExtensions(updatedExtensions);
      setValue("fileExtensions", updatedExtensions);
    }
  };

  const removeExtension = (extension: string) => {
    const updatedExtensions = selectedExtensions.filter(ext => ext !== extension);
    setSelectedExtensions(updatedExtensions);
    setValue("fileExtensions", updatedExtensions);
  };

  const addCustomExtension = () => {
    if (newExtension.trim()) {
      addExtension(newExtension.trim());
      setNewExtension("");
    }
  };

  const loadPresetExtensions = (type: string) => {
    const preset = commonExtensions[type as keyof typeof commonExtensions];
    if (preset) {
      setSelectedExtensions(preset);
      setValue("fileExtensions", preset);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <FileText className="h-6 w-6 text-zinc-400" />
            Configuración de Tipo de Entregable
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. VIDEO, AUDIO, IMAGEN, DOCUMENTO"
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
                placeholder="ej. Video, Audio, Imagen, Documento"
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
                  {deliverableIcons.map((iconName) => (
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
              placeholder="Describe qué tipo de archivos incluye este entregable..."
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
                <span className="text-white text-lg">📄</span>
              </div>
              <div>
                <div className="text-zinc-100 font-poppins font-medium">
                  {watch("name") || "Nombre del Tipo"}
                </div>
                <div className="text-xs text-zinc-500 font-poppins">
                  {watch("code") || "CODIGO"} • Icono: {icon} • {selectedExtensions.length} extensiones
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Extensiones */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <FileText className="h-6 w-6 text-zinc-400" />
            Extensiones de Archivo Permitidas
          </h3>
          
          <div className="space-y-6">
            {/* Presets rápidos */}
            <div>
              <Label className="text-zinc-200 font-poppins font-medium text-base mb-4 block">
                Presets Rápidos
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(commonExtensions).map(([type, extensions]) => (
                  <Button
                    key={type}
                    type="button"
                    variant="outline"
                    onClick={() => loadPresetExtensions(type)}
                    className="border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 font-poppins text-left justify-start"
                  >
                    <div>
                      <div className="font-medium">{type}</div>
                      <div className="text-xs text-zinc-500">
                        {extensions.slice(0, 3).join(", ")}
                        {extensions.length > 3 && "..."}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Agregar extensión personalizada */}
            <div className="space-y-4">
              <Label className="text-zinc-200 font-poppins font-medium text-base">
                Agregar Extensión Personalizada
              </Label>
              <div className="flex gap-3">
                <Input
                  value={newExtension}
                  onChange={(e) => setNewExtension(e.target.value)}
                  placeholder="ej. mp4, pdf, jpg (sin punto)"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomExtension())}
                />
                <Button 
                  type="button"
                  onClick={addCustomExtension}
                  className="bg-green-700 hover:bg-green-600 text-white px-6 h-12"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Extensiones seleccionadas */}
            {selectedExtensions.length > 0 && (
              <div className="space-y-3">
                <Label className="text-zinc-200 font-poppins font-medium text-base">
                  Extensiones Configuradas ({selectedExtensions.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedExtensions.map((extension, index) => (
                    <div key={index} className="flex items-center gap-2 bg-zinc-700/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-zinc-300 font-poppins font-mono">
                        .{extension}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExtension(extension)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-auto"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedExtensions.length === 0 && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-yellow-400 text-sm font-poppins">
                  ⚠️ Se recomienda agregar al menos una extensión de archivo
                </p>
              </div>
            )}
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
                Color del Tipo de Entregable
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
            Tipos Típicos de Entregables
          </h4>
          <div className="space-y-3">
            {getDeliverableExamples().map((example) => (
              <div key={example.code} className="text-sm text-blue-300 font-poppins">
                <span className="font-medium">{example.code}:</span> {example.name} - 
                <span className="text-blue-400"> {example.extensions}</span>
                <div className="text-xs text-blue-400 ml-4 mt-1">{example.usage}</div>
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
            <p>• Los tipos de entregables definen qué archivos pueden subir los colaboradores</p>
            <p>• El sistema valida automáticamente las extensiones permitidas</p>
            <p>• Los clientes ven los entregables organizados por tipo en sus proyectos</p>
            <p>• Los reportes agrupan entregables por tipo para análisis de productividad</p>
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
            {isLoading ? "Guardando..." : deliverableType ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}