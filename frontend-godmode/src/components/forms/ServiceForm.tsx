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
import { Video, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import type { Service, ServiceFormData, ServiceType } from "@/types/forms";

const mockServiceTypes: ServiceType[] = [
  {
    id: "1",
    name: "Transmisión",
    description: "Servicios de transmisión en vivo y circuito cerrado",
    icon: "video",
    isActive: true,
    hasRequirements: true,
    criticalRequirements: [
      "Conexión a internet estable mínimo 50 Mbps de subida",
      "Equipo de transmisión profesional",
      "Micrófono de calidad profesional",
      "Iluminación adecuada para transmisión"
    ],
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
  const [selectedServiceRequirements, setSelectedServiceRequirements] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ServiceFormData>({
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      serviceTypeId: service?.serviceTypeId || "",
      isActive: service?.isActive ?? true,
      requirements: service?.requirements || "",
    }
  });

  const isActive = watch("isActive");
  const serviceTypeId = watch("serviceTypeId");
  const selectedServiceType = mockServiceTypes.find(type => type.id === serviceTypeId);

  // Función para manejar el cambio de tipo de servicio
  const handleServiceTypeChange = (value: string) => {
    setValue("serviceTypeId", value);
    
    const serviceType = mockServiceTypes.find(type => type.id === value);
    if (serviceType && serviceType.hasRequirements && serviceType.criticalRequirements.length > 0) {
      setSelectedServiceRequirements(serviceType.criticalRequirements);
      setShowRequirementsModal(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Información Básica */}
        <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
          <h3 className="text-lg font-sora font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <Video className="h-5 w-5 text-zinc-400" />
            Información Básica
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-zinc-200 font-poppins font-medium">
                Nombre del Servicio *
              </Label>
              <Input
                id="name"
                placeholder="ej. Transmisión en Vivo"
                className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 h-11 font-poppins"
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <p className="text-red-400 text-sm font-poppins">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="serviceTypeId" className="text-zinc-200 font-poppins font-medium">
                Tipo de Servicio *
              </Label>
              <Select 
                value={serviceTypeId} 
                onValueChange={handleServiceTypeChange}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-11 font-poppins">
                  <SelectValue>
                    {selectedServiceType ? (
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>{selectedServiceType.name}</span>
                        {selectedServiceType.hasRequirements && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
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
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>{type.name}</span>
                        {type.hasRequirements && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceTypeId && (
                <p className="text-red-400 text-sm font-poppins">{errors.serviceTypeId.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-zinc-200 font-poppins font-medium">
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Describe el servicio y sus características principales..."
                className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[100px] font-poppins"
                {...register("description")}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-200 font-poppins font-medium">
                Estado
              </Label>
              <Select 
                value={isActive ? "true" : "false"} 
                onValueChange={(value) => setValue("isActive", value === "true")}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-zinc-100 focus:border-zinc-400 focus:ring-zinc-400/20 h-11 font-poppins">
                  <SelectValue>
                    {isActive ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Activo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
                        <span>Inactivo</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 font-poppins">
                  <SelectItem value="true" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Activo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="false" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
                      <span>Inactivo</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Requerimientos */}
        <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
          <h3 className="text-lg font-sora font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-zinc-400" />
            Requerimientos
          </h3>
          
          <div className="space-y-3">
            <Label htmlFor="requirements" className="text-zinc-200 font-poppins font-medium">
              Equipos y Condiciones Necesarias
            </Label>
            <Textarea
              id="requirements"
              placeholder="Describe los equipos, espacios o condiciones necesarias para este servicio..."
              className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[120px] font-poppins"
              {...register("requirements")}
            />
            <p className="text-xs text-zinc-500 font-poppins">
              Ejemplo: Conexión a internet estable, espacio amplio, iluminación adecuada, etc.
            </p>
          </div>
        </div>

        {/* Modal de Requerimientos Críticos */}
        <Dialog open={showRequirementsModal} onOpenChange={setShowRequirementsModal}>
          <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg">
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-2 text-zinc-100 font-sora">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Requerimientos Críticos
              </DialogTitle>
              <DialogDescription className="text-zinc-400 font-poppins">
                Este tipo de servicio requiere equipos y condiciones específicas para funcionar correctamente.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-zinc-200 font-poppins font-medium mb-3">
                  Requerimientos obligatorios:
                </h4>
                <ul className="space-y-2">
                  {selectedServiceRequirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-zinc-300 font-poppins">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm font-poppins">
                  💡 <strong>Importante:</strong> Estos requerimientos aparecerán automáticamente al cliente cuando seleccione este tipo de servicio.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRequirementsModal(false)}
                  className="border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 font-poppins"
                >
                  Entendido
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-700">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 font-poppins"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-poppins"
          >
            {isLoading ? "Guardando..." : service ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}