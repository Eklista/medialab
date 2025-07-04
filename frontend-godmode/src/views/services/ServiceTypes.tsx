import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ServiceType, ServiceTypeFormData } from "@/types/forms";
import ServiceTypesTable from "@/components/tables/ServiceTypesTable";
import ServiceTypeForm from "@/components/forms/ServiceTypeForm";
import CreateModal from "@/components/modals/CreateModal";
import EditModal from "@/components/modals/EditModal";
import ConfirmDelete from "@/components/modals/ConfirmDelete";
import { toast } from "sonner";

export default function ServiceTypes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [deleteId, setDeleteId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: ServiceTypeFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Creating service type:", data);
      toast.success("Tipo de servicio creado exitosamente");
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error("Error al crear el tipo de servicio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: ServiceTypeFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Updating service type:", selectedServiceType?.id, data);
      toast.success("Tipo de servicio actualizado exitosamente");
      setIsEditModalOpen(false);
      setSelectedServiceType(null);
    } catch (error) {
      toast.error("Error al actualizar el tipo de servicio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Deleting service type:", deleteId);
      toast.success("Tipo de servicio eliminado exitosamente");
      setIsDeleteModalOpen(false);
      setDeleteId("");
    } catch (error) {
      toast.error("Error al eliminar el tipo de servicio");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-sora text-zinc-100">
            Tipos de Servicio
          </h2>
          <p className="text-zinc-400 font-poppins">
            Gestiona las categorías de servicios ofrecidos por el departamento
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Tipo
        </Button>
      </div>

      <Card className="bg-zinc-800/50 border-zinc-700/50">
        <CardHeader>
          <CardTitle className="font-sora text-zinc-100">
            Lista de Tipos de Servicio
          </CardTitle>
          <CardDescription className="font-poppins text-zinc-400">
            Configura las categorías de servicios disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceTypesTable 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Tipo de Servicio"
        description="Agrega un nuevo tipo de servicio al sistema"
      >
        <ServiceTypeForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isLoading}
        />
      </CreateModal>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedServiceType(null);
        }}
        title="Editar Tipo de Servicio"
        description="Modifica la información del tipo de servicio"
      >
        <ServiceTypeForm
          serviceType={selectedServiceType || undefined}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedServiceType(null);
          }}
          isLoading={isLoading}
        />
      </EditModal>

      <ConfirmDelete
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteId("");
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar tipo de servicio?"
        description="Esta acción eliminará permanentemente el tipo de servicio y todos los servicios asociados."
        isLoading={isLoading}
      />
    </div>
  );
}