import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Role, RoleFormData } from "@/types/forms";
import RolesTable from "@/components/tables/RolesTable";
import RoleForm from "@/components/forms/RoleForm";
import CreateModal from "@/components/modals/CreateModal";
import EditModal from "@/components/modals/EditModal";
import ConfirmDelete from "@/components/modals/ConfirmDelete";
import { toast } from "sonner";

export default function Roles() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: RoleFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Creating role:", data);
      toast.success("Rol creado exitosamente");
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error("Error al crear el rol");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: RoleFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Updating role:", selectedRole?.id, data);
      toast.success("Rol actualizado exitosamente");
      setIsEditModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast.error("Error al actualizar el rol");
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
      console.log("Deleting role:", deleteId);
      toast.success("Rol eliminado exitosamente");
      setIsDeleteModalOpen(false);
      setDeleteId("");
    } catch (error) {
      toast.error("Error al eliminar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-sora text-zinc-100">
            Roles y Permisos
          </h2>
          <p className="text-zinc-400 font-poppins">
            Define roles de usuario y configura los permisos de acceso al sistema
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Rol
        </Button>
      </div>

      <Card className="bg-zinc-800/50 border-zinc-700/50">
        <CardHeader>
          <CardTitle className="font-sora text-zinc-100">
            Lista de Roles
          </CardTitle>
          <CardDescription className="font-poppins text-zinc-400">
            Gestiona los roles del sistema y configura sus permisos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Rol"
        description="Define un nuevo rol con permisos específicos para los usuarios del sistema"
      >
        <RoleForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isLoading}
        />
      </CreateModal>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRole(null);
        }}
        title="Editar Rol"
        description="Modifica los permisos y configuración del rol seleccionado"
      >
        <RoleForm
          role={selectedRole || undefined}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedRole(null);
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
        title="¿Eliminar rol?"
        description="Esta acción eliminará permanentemente el rol. Los usuarios asignados a este rol perderán sus permisos."
        isLoading={isLoading}
      />
    </div>
  );
}