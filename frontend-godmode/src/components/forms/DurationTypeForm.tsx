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
import { Clock, Info, Calendar } from "lucide-react";

interface DurationTypeFormData {
  code: string;
  name: string;
  description: string;
  monthsDuration: number;
  isActive: boolean;
}

interface DurationTypeFormProps {
  durationType?: DurationTypeFormData & { id: string };
  onSubmit: (data: DurationTypeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const durationExamples = [
  { 
    code: "TRIMESTRAL", 
    name: "Trimestral", 
    months: 3, 
    usage: "Proyectos de corta duración, cursos rápidos",
    description: "Ideal para workshops, cursos intensivos o proyectos específicos"
  },
  { 
    code: "CUATRIMESTRAL", 
    name: "Cuatrimestral", 
    months: 4, 
    usage: "Período académico estándar en algunas universidades",
    description: "Sistema de 3 cuatrimestres por año académico"
  },
  { 
    code: "SEMESTRAL", 
    name: "Semestral", 
    months: 6, 
    usage: "Período académico más común, cursos regulares",
    description: "Sistema tradicional de 2 semestres por año"
  },
  { 
    code: "ANUAL", 
    name: "Anual", 
    months: 12, 
    usage: "Proyectos de largo plazo, programas completos",
    description: "Proyectos que duran todo el año académico"
  },
  { 
    code: "BIANUAL", 
    name: "Bianual", 
    months: 24, 
    usage: "Programas de grado, proyectos de investigación",
    description: "Proyectos que requieren más de un año académico"
  }
];

const getMonthsLabel = (months: number) => {
  if (months === 1) return "1 mes";
  if (months < 12) return `${months} meses`;
  if (months === 12) return "1 año";
  if (months === 24) return "2 años";
  if (months % 12 === 0) return `${months / 12} años`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
};

export default function DurationTypeForm({ 
  durationType, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: DurationTypeFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DurationTypeFormData>({
    defaultValues: {
      code: durationType?.code || "",
      name: durationType?.name || "",
      description: durationType?.description || "",
      monthsDuration: durationType?.monthsDuration || 6,
      isActive: durationType?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");
  const monthsDuration = watch("monthsDuration");

  const loadPresetDuration = (preset: typeof durationExamples[0]) => {
    setValue("code", preset.code);
    setValue("name", preset.name);
    setValue("monthsDuration", preset.months);
    setValue("description", preset.description);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Clock className="h-6 w-6 text-zinc-400" />
            Configuración de Tipo de Duración
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="code" className="text-zinc-200 font-poppins font-medium text-base">
                Código Único *
              </Label>
              <Input
                id="code"
                placeholder="ej. TRIMESTRAL, SEMESTRAL, ANUAL"
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
                placeholder="ej. Trimestral, Semestral, Anual"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="monthsDuration" className="text-zinc-200 font-poppins font-medium text-base">
                Duración en Meses *
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="monthsDuration"
                  type="number"
                  min="1"
                  max="60"
                  placeholder="ej. 6, 12, 24"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins pl-11"
                  {...register("monthsDuration", { 
                    required: "La duración es requerida",
                    valueAsNumber: true,
                    min: { value: 1, message: "La duración debe ser mayor a 0" },
                    max: { value: 60, message: "La duración no puede ser mayor a 60 meses" }
                  })}
                />
              </div>
              {errors.monthsDuration && (
                <p className="text-red-400 text-sm font-poppins">{errors.monthsDuration.message}</p>
              )}
              <p className="text-xs text-zinc-500 font-poppins">
                {monthsDuration ? `Equivale a: ${getMonthsLabel(monthsDuration)}` : "Ingresa la cantidad de meses"}
              </p>
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
              placeholder="Describe cuándo se usa este tipo de duración y qué lo caracteriza..."
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
              <Clock className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-zinc-100 font-poppins font-medium">
                  {watch("name") || "Nombre del Tipo"}
                </div>
                <div className="text-sm text-zinc-400 font-poppins">
                  {watch("code") || "CODIGO"} • {monthsDuration ? getMonthsLabel(monthsDuration) : "0 meses"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Presets Rápidos */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Calendar className="h-6 w-6 text-zinc-400" />
            Presets de Duración Comunes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {durationExamples.map((preset) => (
              <button
                key={preset.code}
                type="button"
                onClick={() => loadPresetDuration(preset)}
                className="p-4 rounded-lg border border-zinc-600 bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <span className="text-zinc-200 font-poppins font-medium">
                    {preset.name}
                  </span>
                </div>
                <div className="text-sm text-zinc-400 font-poppins mb-2">
                  {getMonthsLabel(preset.months)}
                </div>
                <p className="text-xs text-zinc-500 font-poppins">
                  {preset.usage}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Duraciones Típicas del Sistema */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
          <h4 className="text-blue-400 font-poppins font-medium mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Duraciones Típicas del Sistema Universitario
          </h4>
          <div className="space-y-3">
            {durationExamples.map((example) => (
              <div key={example.code} className="text-sm text-blue-300 font-poppins">
                <span className="font-medium">{example.code}:</span> {example.name} ({getMonthsLabel(example.months)})
                <div className="text-xs text-blue-400 mt-1">{example.description}</div>
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
            <p>• Los tipos de duración se asignan a carreras académicas</p>
            <p>• Ayudan a planificar proyectos educativos a largo plazo</p>
            <p>• Los cursos y carreras utilizan estas duraciones para estructurar contenido</p>
            <p>• Los reportes pueden agrupar datos por tipo de duración académica</p>
            <p>• Facilitan la coordinación entre diferentes períodos académicos</p>
          </div>
        </div>

        {/* Consideraciones Especiales */}
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
          <h4 className="text-yellow-400 font-poppins font-medium mb-3">
            ⚠️ Consideraciones Especiales
          </h4>
          <div className="text-sm text-yellow-300 font-poppins space-y-2">
            <p>• <strong>Rango recomendado:</strong> 1-60 meses para cubrir desde cursos cortos hasta programas de postgrado</p>
            <p>• <strong>Nombres claros:</strong> Usa términos que los académicos reconozcan fácilmente</p>
            <p>• <strong>Flexibilidad:</strong> Considera duraciones no estándar para programas especiales</p>
            <p>• <strong>Compatibilidad:</strong> Asegúrate de que sean compatibles con el calendario académico</p>
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
            {isLoading ? "Guardando..." : durationType ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}