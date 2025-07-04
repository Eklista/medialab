import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, MapPin, Users, Calendar, Building } from "lucide-react";
import type { Location } from "@/types/forms";

const mockLocations: Location[] = [
  {
    id: "1",
    name: "Estudio A",
    description: "Estudio principal con iluminación profesional y sistema de audio completo",
    type: "studio",
    capacity: 15,
    equipment: ["cam1", "audio1", "light1"],
    features: ["Aire Acondicionado", "WiFi", "Sistema de Audio", "Insonorización", "Iluminación Profesional"],
    isBookable: true,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "Sala de Juntas",
    description: "Sala equipada para reuniones y presentaciones",
    type: "room",
    capacity: 12,
    equipment: ["proj1"],
    features: ["Aire Acondicionado", "WiFi", "Proyector", "Pantalla", "Mesa de Reunión", "Pizarra"],
    isBookable: true,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "Almacén Principal",
    description: "Almacén central para equipos de producción",
    type: "warehouse",
    capacity: 5,
    equipment: [],
    features: ["Seguridad 24/7", "Acceso Controlado", "Sistema de Inventario"],
    isBookable: false,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "4",
    name: "Estudio B",
    description: "Estudio secundario para producciones menores",
    type: "studio",
    capacity: 8,
    equipment: ["cam2", "audio2"],
    features: ["WiFi", "Sistema de Audio", "Iluminación Básica"],
    isBookable: true,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "5",
    name: "Jardín Central",
    description: "Espacio exterior para grabaciones al aire libre",
    type: "outdoor",
    capacity: 50,
    equipment: [],
    features: ["Iluminación Natural", "Espacio Amplio", "Estacionamiento"],
    isBookable: true,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "6",
    name: "Oficina Técnica",
    description: "Oficina para personal técnico y administrativo",
    type: "office",
    capacity: 4,
    equipment: ["comp1", "comp2"],
    features: ["Aire Acondicionado", "WiFi", "Escritorios", "Archiveros"],
    isBookable: false,
    isActive: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

// Mock data para reservas/uso de ubicaciones
const locationUsage: { [key: string]: { bookings: number; equipmentCount: number } } = {
  "1": { bookings: 15, equipmentCount: 8 }, // Estudio A
  "2": { bookings: 8, equipmentCount: 3 },  // Sala de Juntas
  "3": { bookings: 0, equipmentCount: 25 }, // Almacén Principal
  "4": { bookings: 6, equipmentCount: 5 },  // Estudio B
  "5": { bookings: 3, equipmentCount: 0 },  // Jardín Central
  "6": { bookings: 0, equipmentCount: 2 }   // Oficina Técnica
};

interface LocationsTableProps {
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
}

export default function LocationsTable({ onEdit, onDelete }: LocationsTableProps) {
  const [locations] = useState<Location[]>(mockLocations);

  const getTypeInfo = (type: Location['type']) => {
    switch (type) {
      case 'studio':
        return { label: 'Estudio', icon: '🎬', color: 'text-purple-400' };
      case 'room':
        return { label: 'Sala', icon: '🏢', color: 'text-blue-400' };
      case 'warehouse':
        return { label: 'Almacén', icon: '📦', color: 'text-orange-400' };
      case 'office':
        return { label: 'Oficina', icon: '💼', color: 'text-green-400' };
      case 'outdoor':
        return { label: 'Exterior', icon: '🌳', color: 'text-emerald-400' };
      case 'other':
        return { label: 'Otro', icon: '📍', color: 'text-zinc-400' };
      default:
        return { label: 'Desconocido', icon: '📍', color: 'text-zinc-400' };
    }
  };

  return (
    <div className="rounded-md border border-zinc-700">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-zinc-300 font-poppins">Ubicación</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Tipo y Capacidad</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Características</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Uso</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Estado</TableHead>
            <TableHead className="text-zinc-300 font-poppins text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => {
            const typeInfo = getTypeInfo(location.type);
            const usage = locationUsage[location.id] || { bookings: 0, equipmentCount: 0 };
            
            return (
              <TableRow key={location.id} className="border-zinc-700 hover:bg-zinc-800/50">
                <TableCell className="font-poppins">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-700/50 rounded-lg">
                      <MapPin className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-zinc-100">
                        {location.name}
                      </div>
                      <div className="text-sm text-zinc-400 max-w-xs truncate">
                        {location.description}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-poppins">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <span className={`font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    {location.capacity && (
                      <div className="flex items-center gap-1 text-sm text-zinc-400">
                        <Users className="h-3 w-3" />
                        <span>{location.capacity} personas</span>
                      </div>
                    )}
                    {location.isBookable && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <Calendar className="h-3 w-3" />
                        <span>Reservable</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-poppins">
                  <div className="space-y-2">
                    <div className="text-sm text-zinc-300">
                      {location.features?.length || 0} características
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {location.features?.slice(0, 2).map((feature, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="bg-zinc-700/50 text-zinc-400 border-zinc-600 text-xs font-poppins"
                        >
                          {feature}
                        </Badge>
                      ))}
                      {(location.features?.length || 0) > 2 && (
                        <Badge 
                          variant="secondary" 
                          className="bg-zinc-600/50 text-zinc-500 border-zinc-600 text-xs font-poppins"
                        >
                          +{(location.features?.length || 0) - 2} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-poppins">
                  <div className="space-y-1 text-sm">
                    {location.isBookable && (
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Calendar className="h-3 w-3" />
                        <span>{usage.bookings} reservas</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Building className="h-3 w-3" />
                      <span>{usage.equipmentCount} equipos</span>
                    </div>
                    {usage.bookings === 0 && usage.equipmentCount === 0 && (
                      <div className="text-zinc-500 text-xs">
                        Sin uso registrado
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge 
                      variant={location.isActive ? "default" : "secondary"}
                      className={location.isActive 
                        ? "bg-green-900/50 text-green-400 border-green-800 font-poppins" 
                        : "bg-zinc-700 text-zinc-400 border-zinc-600 font-poppins"
                      }
                    >
                      {location.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                      <DropdownMenuItem 
                        onClick={() => onEdit(location)}
                        className="text-zinc-300 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {usage.bookings === 0 && usage.equipmentCount === 0 ? (
                        <DropdownMenuItem 
                          onClick={() => onDelete(location.id)}
                          className="text-red-400 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          disabled
                          className="text-zinc-600 font-poppins cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          No se puede eliminar (en uso)
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}