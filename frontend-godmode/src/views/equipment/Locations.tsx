import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Calendar, Building } from "lucide-react";
import LocationsTable from "@/components/tables/LocationsTable";
import LocationForm from "@/components/forms/LocationForm";
import CreateModal from "@/components/modals/CreateModal";
import EditModal from "@/components/modals/EditModal";
import ConfirmDelete from "@/components/modals/ConfirmDelete";
import { toast } from "sonner";
import type { Location, LocationFormData } from "@/types/forms";

export default function Locations() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [deleteId, setDeleteId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: LocationFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Creating location:", data);
      toast.success("Ubicación creada exitosamente");
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error("Error al crear la ubicación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: LocationFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      console.log("Updating location:", selectedLocation?.id, data);
      toast.success("Ubicación actualizada exitosamente");
      setIsEditModalOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      toast.error("Error al actualizar la ubicación");
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
      console.log("Deleting location:", deleteId);
      toast.success("Ubicación eliminada exitosamente");
      setIsDeleteModalOpen(false);
      setDeleteId("");
    } catch (error) {
      toast.error("Error al eliminar la ubicación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-sora text-zinc-100">
            Ubicaciones
          </h2>
          <p className="text-zinc-400 font-poppins">
            Gestiona salas, estudios, almacenes y espacios disponibles
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Ubicación
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 font-poppins">Total Ubicaciones</p>
                <p className="text-2xl font-bold text-zinc-100 font-sora">6</p>
              </div>
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 font-poppins">Ubicaciones Activas</p>
                <p className="text-2xl font-bold text-green-400 font-sora">5</p>
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
                <p className="text-sm text-zinc-400 font-poppins">Espacios Reservables</p>
                <p className="text-2xl font-bold text-purple-400 font-sora">4</p>
              </div>
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 font-poppins">Equipos Asignados</p>
                <p className="text-2xl font-bold text-orange-400 font-sora">43</p>
              </div>
              <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Building className="w-4 h-4 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información sobre tipos de ubicación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎬</span>
              <h3 className="font-sora font-medium text-zinc-100">Estudios</h3>
            </div>
            <p className="text-sm text-zinc-400 font-poppins">
              Espacios equipados para grabación y producción audiovisual
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏢</span>
              <h3 className="font-sora font-medium text-zinc-100">Salas</h3>
            </div>
            <p className="text-sm text-zinc-400 font-poppins">
              Salas de reunión, conferencia y trabajo colaborativo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📦</span>
              <h3 className="font-sora font-medium text-zinc-100">Almacenes</h3>
            </div>
            <p className="text-sm text-zinc-400 font-poppins">
              Almacenamiento seguro de equipos y materiales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Información importante */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
        <h3 className="text-blue-400 font-poppins font-medium mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Información sobre Ubicaciones
        </h3>
        <div className="text-sm text-blue-300 font-poppins space-y-2">
          <p>• <strong>God Mode:</strong> Define únicamente las ubicaciones principales y sus características</p>
          <p>• <strong>Dashboard:</strong> Las secretarias asignan equipos específicos a cada ubicación</p>
          <p>• <strong>Reservables:</strong> Los espacios marcados como reservables aparecen en el calendario</p>
          <p>• <strong>Características:</strong> Ayudan a los usuarios a elegir la ubicación más adecuada</p>
        </div>
      </div>

      <Card className="bg-zinc-800/50 border-zinc-700/50">
        <CardHeader>
          <CardTitle className="font-sora text-zinc-100">
            Lista de Ubicaciones
          </CardTitle>
          <CardDescription className="font-poppins text-zinc-400">
            Gestiona todos los espacios disponibles para producción y trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationsTable 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Ubicación"
        description="Agrega un nuevo espacio al sistema con sus características y equipamiento"
      >
        <LocationForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isLoading}
        />
      </CreateModal>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLocation(null);
        }}
        title="Editar Ubicación"
        description="Modifica la información de la ubicación seleccionada"
      >
        <LocationForm
          location={selectedLocation || undefined}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedLocation(null);
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
        title="¿Eliminar ubicación?"
        description="Esta acción eliminará permanentemente la ubicación. Asegúrate de que no tenga equipos asignados o reservas activas."
        isLoading={isLoading}
      />
    </div>
  );
}