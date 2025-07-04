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
import { MoreHorizontal, Edit, Trash2, Camera, Mic, Lightbulb, Monitor, Headphones, Smartphone } from "lucide-react";
import type { EquipmentType } from "@/types/forms";

const mockEquipmentTypes: EquipmentType[] = [
  {
    id: "1",
    name: "Cámaras",
    description: "Cámaras de video profesionales, DSLR y mirrorless",
    icon: "camera",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "Audio",
    description: "Micrófonos, grabadoras, mezcladores y equipos de sonido",
    icon: "mic",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "Iluminación",
    description: "Luces LED, paneles, reflectores y accesorios de iluminación",
    icon: "lightbulb",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "4",
    name: "Equipo de Cómputo",
    description: "Computadoras, laptops, monitores y periféricos",
    icon: "monitor",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "5",
    name: "Accesorios",
    description: "Trípodes, estabilizadores, filtros y otros accesorios",
    icon: "smartphone",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "6",
    name: "Monitoreo",
    description: "Audífonos, parlantes y equipos de monitoreo",
    icon: "headphones",
    isActive: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

// Mock data para contar equipos por tipo
const equipmentCountByType: { [key: string]: number } = {
  "1": 12, // Cámaras
  "2": 8,  // Audio
  "3": 15, // Iluminación
  "4": 6,  // Equipo de Cómputo
  "5": 25, // Accesorios
  "6": 0   // Monitoreo
};

interface EquipmentTypesTableProps {
  onEdit: (equipmentType: EquipmentType) => void;
  onDelete: (id: string) => void;
}

export default function EquipmentTypesTable({ onEdit, onDelete }: EquipmentTypesTableProps) {
  const [equipmentTypes] = useState<EquipmentType[]>(mockEquipmentTypes);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'camera':
        return <Camera className="h-4 w-4 text-zinc-400" />;
      case 'mic':
        return <Mic className="h-4 w-4 text-zinc-400" />;
      case 'lightbulb':
        return <Lightbulb className="h-4 w-4 text-zinc-400" />;
      case 'monitor':
        return <Monitor className="h-4 w-4 text-zinc-400" />;
      case 'headphones':
        return <Headphones className="h-4 w-4 text-zinc-400" />;
      case 'smartphone':
        return <Smartphone className="h-4 w-4 text-zinc-400" />;
      default:
        return <Camera className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="rounded-md border border-zinc-700">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-zinc-300 font-poppins">Tipo de Equipo</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Descripción</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Equipos Registrados</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Estado</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Fecha Creación</TableHead>
            <TableHead className="text-zinc-300 font-poppins text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipmentTypes.map((equipmentType) => {
            const equipmentCount = equipmentCountByType[equipmentType.id] || 0;
            
            return (
              <TableRow key={equipmentType.id} className="border-zinc-700 hover:bg-zinc-800/50">
                <TableCell className="font-medium text-zinc-100 font-poppins">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-700/50 rounded-lg">
                      {getIcon(equipmentType.icon || 'camera')}
                    </div>
                    <span>{equipmentType.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400 font-poppins max-w-md">
                  <div className="truncate">
                    {equipmentType.description || "Sin descripción"}
                  </div>
                </TableCell>
                <TableCell className="font-poppins">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300 font-medium">
                      {equipmentCount}
                    </span>
                    <span className="text-zinc-500 text-sm">
                      {equipmentCount === 1 ? 'equipo' : 'equipos'}
                    </span>
                  </div>
                  {equipmentCount > 0 && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Gestionados en Dashboard
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={equipmentType.isActive ? "default" : "secondary"}
                    className={equipmentType.isActive 
                      ? "bg-green-900/50 text-green-400 border-green-800 font-poppins" 
                      : "bg-zinc-700 text-zinc-400 border-zinc-600 font-poppins"
                    }
                  >
                    {equipmentType.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-400 font-poppins">
                  {new Date(equipmentType.createdAt).toLocaleDateString('es-ES')}
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
                        onClick={() => onEdit(equipmentType)}
                        className="text-zinc-300 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {equipmentCount === 0 ? (
                        <DropdownMenuItem 
                          onClick={() => onDelete(equipmentType.id)}
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
                          No se puede eliminar ({equipmentCount} equipos)
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