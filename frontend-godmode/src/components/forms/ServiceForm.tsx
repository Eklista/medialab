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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Video, FileText, AlertTriangle, CheckCircle, Plus, X } from "lucide-react";
import type { Service, ServiceFormData, ServiceType } from "@/types/forms";

const mockServiceTypes: ServiceType[] = [
  {
    id: "1",
    name: "Transmisión",
    description: "Servicios de transmisión en vivo y circuito cerrado",
    icon: "video",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "Producción",
    description: "Servicios de producción audiovisual",
    icon: "video",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ServiceForm({ 
  service, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ServiceFormProps) {
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [criticalRequirements, setCriticalRequirements] = useState<string[]>(
    service?.criticalRequirements || []
  );
  const [newRequirement, setNewRequirement] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ServiceFormData>({
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      serviceTypeId: service?.serviceTypeId || "",
      isActive: service?.isActive ?? true,
      requirements: service?.requirements || "",
      hasCriticalRequirements: service?.hasCriticalRequirements ?? false,
      criticalRequirements: service?.criticalRequirements || [],
    }
  });

  const isActive = watch("isActive");
  const serviceTypeId = watch("serviceTypeId");
  const hasCriticalRequirements = watch("hasCriticalRequirements");
  const selectedServiceType = mockServiceTypes.find(type => type.id === serviceTypeId);

  const addRequirement = () => {
    if (newRequirement.trim() && !criticalRequirements.includes(newRequirement.trim())) {
      const updatedRequirements = [...criticalRequirements, newRequirement.trim()];
      setCriticalRequirements(updatedRequirements);
      setValue("criticalRequirements", updatedRequirements);
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    const updatedRequirements = criticalRequirements.filter((_, i) => i !== index);
    setCriticalRequirements(updatedRequirements);
    setValue("criticalRequirements", updatedRequirements);
  };

  const handleCriticalRequirementsChange = (value: string) => {
    const hasRequirements = value === "true";
    setValue("hasCriticalRequirements", hasRequirements);
    
    if (hasRequirements) {
      setShowRequirementsModal(true);
    } else {
      setCriticalRequirements([]);
      setValue("criticalRequirements", []);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <Video className="h-6 w-6 text-zinc-400" />
            Información Básica del Servicio
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label htmlFor="name" className="text-zinc-200 font-poppins font-medium text-base">
                Nombre del Servicio *
              </Label>
              <Input
                id="name"
                placeholder="ej. Transmisión en Vivo, Grabación de Audio"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="serviceTypeId" className="text-zinc-200 font-poppins font-medium text-base">
                Tipo de Servicio *
              </Label>
              <Select 
                value={serviceTypeId} 
                onValueChange={(value) => setValue("serviceTypeId", value)}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    {selectedServiceType ? (
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5" />
                        <span>{selectedServiceType.name}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Selecciona un tipo de servicio</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  {mockServiceTypes.map((type) => (
                    <SelectItem 
                      key={type.id} 
                      value={type.id}
                      className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5" />
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceTypeId && (
                <p className="text-red-400 text-sm font-poppins">{errors.serviceTypeId.message}</p>
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
              <Label className="text-zinc-200 font-poppins font-medium text-base">
                ¿Tiene Requerimientos Críticos?
              </Label>
              <Select 
                value={hasCriticalRequirements ? "true" : "false"} 
                onValueChange={handleCriticalRequirementsChange}
              >
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-12 text-base font-poppins">
                  <SelectValue>
                    {hasCriticalRequirements ? (
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span>Sí, tiene requerimientos críticos</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>No tiene requerimientos críticos</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  <SelectItem value="true" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <span>Sí, tiene requerimientos críticos</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="false" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>No tiene requerimientos críticos</span>
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
              placeholder="Describe el servicio y sus características principales..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("description")}
            />
          </div>

          {/* Mostrar requerimientos críticos si los hay */}
          {hasCriticalRequirements && criticalRequirements.length > 0 && (
            <div className="mt-8 p-6 bg-orange-900/20 border border-orange-700/50 rounded-lg">
              <h4 className="text-orange-400 font-poppins font-medium mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Requerimientos Críticos Configurados
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {criticalRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-orange-300 font-poppins">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="flex-1">{req}</span>
                  </div>
                ))}
              </div>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowRequirementsModal(true)}
                className="mt-4 border-orange-600 bg-orange-900/20 text-orange-300 hover:bg-orange-800/30 hover:text-orange-200 font-poppins"
              >
                Editar Requerimientos
              </Button>
            </div>
          )}
        </div>

        {/* Requerimientos Adicionales */}
        <div className="bg-zinc-800/30 rounded-lg p-8 border border-zinc-700/50">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-8 flex items-center gap-3">
            <FileText className="h-6 w-6 text-zinc-400" />
            Requerimientos Adicionales
          </h3>
          
          <div className="space-y-4">
            <Label htmlFor="requirements" className="text-zinc-200 font-poppins font-medium text-base">
              Equipos y Condiciones Necesarias
            </Label>
            <Textarea
              id="requirements"
              placeholder="Describe los equipos, espacios o condiciones adicionales necesarias para este servicio..."
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] text-base font-poppins resize-none"
              {...register("requirements")}
            />
            <p className="text-sm text-zinc-500 font-poppins">
              Ejemplo: Conexión a internet estable, espacio amplio, iluminación adecuada, etc.
            </p>
          </div>
        </div>

        {/* Modal de Requerimientos Críticos */}
        <Dialog open={showRequirementsModal} onOpenChange={setShowRequirementsModal}>
          <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl">
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-2 text-zinc-100 font-sora">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Configurar Requerimientos Críticos
              </DialogTitle>
              <DialogDescription className="text-zinc-400 font-poppins">
                Define los requerimientos obligatorios que aparecerán automáticamente al cliente cuando seleccione este servicio.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-zinc-200 font-poppins font-medium">
                  Agregar Nuevo Requerimiento
                </Label>
                <div className="flex gap-3">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="ej. Conexión a internet estable mínimo 50 Mbps"
                    className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 font-poppins"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <Button 
                    type="button"
                    onClick={addRequirement}
                    className="bg-green-700 hover:bg-green-600 text-white px-6"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {criticalRequirements.length > 0 && (
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <h4 className="text-zinc-200 font-poppins font-medium mb-3">
                    Requerimientos Configurados:
                  </h4>
                  <div className="space-y-2">
                    {criticalRequirements.map((requirement, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-zinc-700/30 rounded-md">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="flex-1 text-sm text-zinc-300 font-poppins">{requirement}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequirement(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-yellow-400 text-sm font-poppins">
                  💡 <strong>Importante:</strong> Estos requerimientos aparecerán automáticamente al cliente cuando seleccione este servicio en el portal.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowRequirementsModal(false)}
                  className="border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 font-poppins"
                >
                  Guardar y Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
            {isLoading ? "Guardando..." : service ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}