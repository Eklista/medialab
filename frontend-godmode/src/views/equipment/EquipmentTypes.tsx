import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EquipmentTypesTable from "@/components/tables/EquipmentTypesTable";
import EquipmentTypeForm from "@/components/forms/EquipmentTypeForm";
import CreateModal from "@/components/modals/CreateModal";
import EditModal from "@/components/modals/EditModal";
import ConfirmDelete from "@/components/modals/ConfirmDelete";
import { toast } from "sonner";
import type { EquipmentType, EquipmentTypeFormData } from "@/types/forms";

export default function EquipmentTypes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType | null>(null);
  const [deleteId, setDeleteId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: EquipmentTypeFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Creating equipment type:", data);
      toast.success("Tipo de equipo creado exitosamente");
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error("Error al crear el tipo de equipo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (equipmentType: EquipmentType) => {
    setSelectedEquipmentType(equipmentType);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: EquipmentTypeFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Updating equipment type:", selectedEquipmentType?.id, data);
      toast.success("Tipo de equipo actualizado exitosamente");
      setIsEditModalOpen(false);
      setSelectedEquipmentType(null);
    } catch (error) {
      toast.error("Error al actualizar el tipo de equipo");
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
      console.log("Deleting equipment type:", deleteId);
      toast.success("Tipo de equipo eliminado exitosamente");
      setIsDeleteModalOpen(false);
      setDeleteId("");
    } catch (error) {
      toast.error("Error al eliminar el tipo de equipo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-sora text-zinc-100">
            Tipos de Equipo
          </h2>
          <p className="text-zinc-400 font-poppins">
            Define las categorías principales de equipos del sistema
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
            Lista de Tipos de Equipo
          </CardTitle>
          <CardDescription className="font-poppins text-zinc-400">
            Gestiona las categorías principales que estarán disponibles en el Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquipmentTypesTable 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Tipo de Equipo"
        description="Define una nueva categoría principal de equipos para el sistema"
      >
        <EquipmentTypeForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isLoading}
        />
      </CreateModal>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEquipmentType(null);
        }}
        title="Editar Tipo de Equipo"
        description="Modifica la información del tipo de equipo seleccionado"
      >
        <EquipmentTypeForm
          equipmentType={selectedEquipmentType || undefined}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedEquipmentType(null);
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
        title="¿Eliminar tipo de equipo?"
        description="Esta acción eliminará permanentemente el tipo de equipo. Asegúrate de que no tenga equipos registrados."
        isLoading={isLoading}
      />
    </div>
  );
}