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
import { MoreHorizontal, Edit, Trash2, Video } from "lucide-react";
import type { ServiceType } from "@/types/forms";

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
    description: "Servicios de producción audiovisual y multimedia",
    icon: "video",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "Audio",
    description: "Servicios especializados en grabación y producción de audio",
    icon: "video",
    isActive: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

interface ServiceTypesTableProps {
  onEdit: (serviceType: ServiceType) => void;
  onDelete: (id: string) => void;
}

export default function ServiceTypesTable({ onEdit, onDelete }: ServiceTypesTableProps) {
  const [serviceTypes] = useState<ServiceType[]>(mockServiceTypes);

  return (
    <div className="rounded-md border border-zinc-700">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-zinc-300 font-poppins">Tipo de Servicio</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Descripción</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Estado</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Fecha Creación</TableHead>
            <TableHead className="text-zinc-300 font-poppins text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {serviceTypes.map((serviceType) => (
            <TableRow key={serviceType.id} className="border-zinc-700 hover:bg-zinc-800/50">
              <TableCell className="font-medium text-zinc-100 font-poppins">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-700/50 rounded-lg">
                    <Video className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span>{serviceType.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-zinc-400 font-poppins max-w-md">
                <div className="truncate">
                  {serviceType.description || "Sin descripción"}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={serviceType.isActive ? "default" : "secondary"}
                  className={serviceType.isActive 
                    ? "bg-green-900/50 text-green-400 border-green-800 font-poppins" 
                    : "bg-zinc-700 text-zinc-400 border-zinc-600 font-poppins"
                  }
                >
                  {serviceType.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-zinc-400 font-poppins">
                {new Date(serviceType.createdAt).toLocaleDateString('es-ES')}
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
                      onClick={() => onEdit(serviceType)}
                      className="text-zinc-300 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(serviceType.id)}
                      className="text-red-400 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}