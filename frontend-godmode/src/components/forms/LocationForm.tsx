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
import { MapPin, Building, Users, Settings, X, Plus } from "lucide-react";
import type { Location, LocationFormData } from "@/types/forms";

const locationTypes = [
  { value: 'studio', label: 'Estudio', icon: '🎬', description: 'Espacio para grabación y producción' },
  { value: 'room', label: 'Sala', icon: '🏢', description: 'Salas de reunión, conferencia o trabajo' },
  { value: 'warehouse', label: 'Almacén', icon: '📦', description: 'Almacenamiento de equipos y materiales' },
  { value: 'office', label: 'Oficina', icon: '💼', description: 'Espacios administrativos' },
  { value: 'outdoor', label: 'Exterior', icon: '🌳', description: 'Espacios al aire libre' },
  { value: 'other', label: 'Otro', icon: '📍', description: 'Otros tipos de ubicación' }
];

const commonFeatures = [
  'Aire Acondicionado',
  'WiFi',
  'Proyector',
  'Pantalla',
  'Sistema de Audio',
  'Insonorización',
  'Iluminación Profesional',
  'Tomas de Corriente',
  'Mesa de Reunión',
  'Pizarra',
  'Baño Privado',
  'Cocina/Kitchenette',
  'Acceso para Discapacitados',
  'Estacionamiento',
  'Seguridad 24/7'
];

interface LocationFormProps {
  location?: Location;
  onSubmit: (data: LocationFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function LocationForm({ 
  location, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: LocationFormProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    location?.features || []
  );
  const [newFeature, setNewFeature] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LocationFormData>({
    defaultValues: {
      name: location?.name || "",
      description: location?.description || "",
      type: location?.type || "room",
      capacity: location?.capacity || undefined,
      features: location?.features || [],
      isBookable: location?.isBookable ?? true,
      isActive: location?.isActive ?? true,
    }
  });

  const isActive = watch("isActive");
  const isBookable = watch("isBookable");
  const locationType = watch("type");
  const selectedLocationType = locationTypes.find(type => type.value === locationType);

  const addFeature = (feature: string) => {
    if (!selectedFeatures.includes(feature)) {
      const updatedFeatures = [...selectedFeatures, feature];
      setSelectedFeatures(updatedFeatures);
      setValue("features", updatedFeatures);
    }
  };

  const removeFeature = (feature: string) => {
    const updatedFeatures = selectedFeatures.filter(f => f !== feature);
    setSelectedFeatures(updatedFeatures);
    setValue("features", updatedFeatures);
  };

  const addCustomFeature = () => {
    if (newFeature.trim() && !selectedFeatures.includes(newFeature.trim())) {
      addFeature(newFeature.trim());
      setNewFeature("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <MapPin className="h-6 w-6 text-zinc-400" />
            Información Básica de la Ubicación
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="name" className="text-zinc-200 font-poppins font-medium text-base">
                Nombre de la Ubicación *
              </Label>
              <Input
                id="name"
                placeholder="ej. Estudio A, Sala de Juntas, Almacén Principal"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="type" className="text-zinc-200 font-poppins font-medium text-base">
                Tipo de Ubicación *
              </Label>
              <Select 
                value={locationType} 
                onValueChange={(value) => setValue("type", value as LocationFormData['type'])}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    {selectedLocationType ? (
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{selectedLocationType.icon}</span>
                        <div className="text-left">
                          <div>{selectedLocationType.label}</div>
                          <div className="text-xs text-zinc-500">{selectedLocationType.description}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Selecciona un tipo</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  {locationTypes.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{type.icon}</span>
                        <div className="text-left">
                          <div>{type.label}</div>
                          <div className="text-xs text-zinc-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label htmlFor="capacity" className="text-zinc-200 font-poppins font-medium text-base">
                Capacidad (personas)
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="ej. 20"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins pl-11"
                  {...register("capacity", { 
                    valueAsNumber: true,
                    min: { value: 1, message: "La capacidad debe ser mayor a 0" }
                  })}
                />
              </div>
              {errors.capacity && (
                <p className="text-red-400 text-sm font-poppins">{errors.capacity.message}</p>
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
              placeholder="Describe la ubicación, sus características principales y uso recomendado..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("description")}
            />
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-4">
              <Label className="text-zinc-200 font-poppins font-medium text-base">
                ¿Se puede reservar?
              </Label>
              <Select 
                value={isBookable ? "true" : "false"} 
                onValueChange={(value) => setValue("isBookable", value === "true")}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins w-auto min-w-[200px]">
                  <SelectValue>
                    {isBookable ? (
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-green-500" />
                        <span>Sí, se puede reservar</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-zinc-500" />
                        <span>No se puede reservar</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  <SelectItem value="true" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-green-500" />
                      <span>Sí, se puede reservar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="false" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-zinc-500" />
                      <span>No se puede reservar</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-zinc-500 font-poppins">
              Los espacios reservables aparecerán en el sistema de calendarios del Dashboard
            </p>
          </div>
        </div>

        {/* Características y Equipamiento */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Building className="h-6 w-6 text-zinc-400" />
            Características y Equipamiento
          </h3>
          
          <div className="space-y-6">
            <div>
              <Label className="text-zinc-200 font-poppins font-medium text-base mb-4 block">
                Características Disponibles
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {commonFeatures.map((feature) => (
                  <Button
                    key={feature}
                    type="button"
                    variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                    size="sm"
                    onClick={() => selectedFeatures.includes(feature) ? removeFeature(feature) : addFeature(feature)}
                    className={`justify-start text-left font-poppins ${
                      selectedFeatures.includes(feature)
                        ? "bg-zinc-600 border-zinc-500 text-zinc-100"
                        : "border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {feature}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-200 font-poppins font-medium text-base">
                Agregar Característica Personalizada
              </Label>
              <div className="flex gap-3">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="ej. Cámara de Seguridad, Ventanas Grandes"
                  className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
                />
                <Button 
                  type="button"
                  onClick={addCustomFeature}
                  className="bg-green-700 hover:bg-green-600 text-white px-6 h-12"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedFeatures.length > 0 && (
              <div className="space-y-3">
                <Label className="text-zinc-200 font-poppins font-medium text-base">
                  Características Seleccionadas
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 bg-zinc-700/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-zinc-300 font-poppins">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(feature)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-auto"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información sobre uso */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
          <h4 className="text-blue-400 font-poppins font-medium mb-3">
            💡 Información Importante
          </h4>
          <div className="text-sm text-blue-300 font-poppins space-y-2">
            <p>• Las ubicaciones activas estarán disponibles en el Dashboard para asignación de equipos</p>
            <p>• Los espacios marcados como reservables aparecerán en el sistema de calendarios</p>
            <p>• Las características ayudan a los usuarios a elegir la ubicación más adecuada</p>
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
            {isLoading ? "Guardando..." : location ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}