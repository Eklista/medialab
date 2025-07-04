import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import type { User, UserFormData } from "@/types/forms";
import UsersTable from "@/components/tables/UsersTable";
import UserForm from "@/components/forms/UserForm";
import CreateModal from "@/components/modals/CreateModal";
import EditModal from "@/components/modals/EditModal";
import ConfirmDelete from "@/components/modals/ConfirmDelete";
import { toast } from "sonner";

export default function Users() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Creating user and sending invitation:", data);
      toast.success(`Invitación enviada a ${data.email}`);
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error("Error al enviar la invitación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Updating user:", selectedUser?.id, data);
      toast.success("Usuario actualizado exitosamente");
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Error al actualizar el usuario");
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
      console.log("Deleting user:", deleteId);
      toast.success("Usuario eliminado exitosamente");
      setIsDeleteModalOpen(false);
      setDeleteId("");
    } catch (error) {
      toast.error("Error al eliminar el usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendInvitation = async (user: User) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Resending invitation to:", user.email);
      toast.success(`Invitación reenviada a ${user.email}`);
    } catch (error) {
      toast.error("Error al reenviar la invitación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-sora text-zinc-100">
            Gestión de Usuarios
          </h2>
          <p className="text-zinc-400 font-poppins">
            Administra usuarios del sistema y envía invitaciones para nuevos miembros
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
        >
          <Plus className="h-4 w-4 mr-2" />
          Invitar Usuario
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 font-poppins">Total Usuarios</p>
                <p className="text-2xl font-bold text-zinc-100 font-sora">24</p>
              </div>
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 font-poppins">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-400 font-sora">21</p>
              </div>
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 font-poppins">Invitaciones Pendientes</p>
                <p className="text-2xl font-bold text-yellow-400 font-sora">3</p>
              </div>
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 font-poppins">Últimos 7 días</p>
                <p className="text-2xl font-bold text-zinc-100 font-sora">+2</p>
              </div>
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-800/50 border-zinc-700/50">
        <CardHeader>
          <CardTitle className="font-sora text-zinc-100">
            Lista de Usuarios
          </CardTitle>
          <CardDescription className="font-poppins text-zinc-400">
            Gestiona los usuarios del sistema, sus roles y estado de invitación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable 
            onEdit={handleEdit}
            onDelete={handleDelete}
            onResendInvitation={handleResendInvitation}
          />
        </CardContent>
      </Card>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Invitar Nuevo Usuario"
        description="Envía una invitación por correo electrónico para que el usuario complete su registro"
      >
        <UserForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isLoading}
        />
      </CreateModal>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Editar Usuario"
        description="Modifica la información del usuario y sus permisos"
      >
        <UserForm
          user={selectedUser || undefined}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
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
        title="¿Eliminar usuario?"
        description="Esta acción eliminará permanentemente el usuario y toda su información asociada."
        isLoading={isLoading}
      />
    </div>
  );
}