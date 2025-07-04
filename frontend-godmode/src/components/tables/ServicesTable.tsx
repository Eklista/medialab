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
import type { Service } from "@/types/forms";

const mockServices: Service[] = [
  {
    id: "1",
    name: "Transmisión en Vivo",
    description: "Transmisión en tiempo real con múltiples cámaras",
    serviceTypeId: "1",
    serviceType: {
      id: "1",
      name: "Transmisión",
      description: "Servicios de transmisión",
      isActive: true,
      hasRequirements: true,
      criticalRequirements: [
        "Conexión a internet estable mínimo 50 Mbps de subida",
        "Equipo de transmisión profesional"
      ],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z"
    },
    isActive: true,
    requirements: "Conexión a internet estable, iluminación adecuada",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

interface ServicesTableProps {
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export default function ServicesTable({ onEdit, onDelete }: ServicesTableProps) {
  const [services] = useState<Service[]>(mockServices);

  return (
    <div className="rounded-md border border-zinc-700">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700">
            <TableHead className="text-zinc-300 font-poppins">Servicio</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Tipo</TableHead>
            <TableHead className="text-zinc-300 font-poppins">Estado</TableHead>
            <TableHead className="text-zinc-300 font-poppins text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id} className="border-zinc-700 hover:bg-zinc-800/50">
              <TableCell className="font-poppins">
                <div className="space-y-1">
                  <div className="font-medium text-zinc-100 flex items-center gap-2">
                    <Video className="h-4 w-4 text-zinc-400" />
                    {service.name}
                  </div>
                  <div className="text-sm text-zinc-400 max-w-xs truncate">
                    {service.description || "Sin descripción"}
                  </div>
                  {service.requirements && (
                    <div className="text-xs text-zinc-500 max-w-xs truncate">
                      Req: {service.requirements}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-zinc-700 text-zinc-300 border-zinc-600 font-poppins">
                  {service.serviceType?.name}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={service.isActive ? "default" : "secondary"}
                  className={service.isActive 
                    ? "bg-green-900/50 text-green-400 border-green-800 font-poppins" 
                    : "bg-zinc-700 text-zinc-400 border-zinc-600 font-poppins"
                  }
                >
                  {service.isActive ? "Activo" : "Inactivo"}
                </Badge>
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
                      onClick={() => onEdit(service)}
                      className="text-zinc-300 hover:bg-zinc-700 focus:bg-zinc-700 font-poppins"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(service.id)}
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