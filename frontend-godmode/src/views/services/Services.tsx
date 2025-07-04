import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Service, ServiceFormData } from "@/types/forms";
import ServicesTable from "@/components/tables/ServicesTable";
import ServiceForm from "@/components/forms/ServiceForm";
import CreateModal from "@/components/modals/CreateModal";
import EditModal from "@/components/modals/EditModal";
import ConfirmDelete from "@/components/modals/ConfirmDelete";
import { toast } from "sonner";

export default function Services() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: ServiceFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Creating service:", data);
      toast.success("Servicio creado exitosamente");
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error("Error al crear el servicio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: ServiceFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Updating service:", selectedService?.id, data);
      toast.success("Servicio actualizado exitosamente");
      setIsEditModalOpen(false);
      setSelectedService(null);
    } catch (error) {
      toast.error("Error al actualizar el servicio");
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
      console.log("Deleting service:", deleteId);
      toast.success("Servicio eliminado exitosamente");
      setIsDeleteModalOpen(false);
      setDeleteId("");
    } catch (error) {
      toast.error("Error al eliminar el servicio");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-sora text-zinc-100">
            Servicios
          </h2>
          <p className="text-zinc-400 font-poppins">
            Gestiona los servicios individuales dentro de cada tipo de servicio
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Servicio
        </Button>
      </div>

      <Card className="bg-zinc-800/50 border-zinc-700/50">
        <CardHeader>
          <CardTitle className="font-sora text-zinc-100">
            Lista de Servicios
          </CardTitle>
          <CardDescription className="font-poppins text-zinc-400">
            Configura los servicios específicos que se ofrecen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServicesTable 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Servicio"
        description="Agrega un nuevo servicio al sistema"
      >
        <ServiceForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isLoading}
        />
      </CreateModal>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedService(null);
        }}
        title="Editar Servicio"
        description="Modifica la información del servicio"
      >
        <ServiceForm
          service={selectedService || undefined}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedService(null);
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
        title="¿Eliminar servicio?"
        description="Esta acción eliminará permanentemente el servicio."
        isLoading={isLoading}
      />
    </div>
  );
}