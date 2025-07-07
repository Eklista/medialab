import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Briefcase, 
  Settings, 
  Video, 
  Package, 
  FileText, 
  AlertTriangle, 
  Layers, 
  Clock,
  Plus,
  Database,
  Cog
} from "lucide-react";

// Import all forms
import UserTypeForm from "../../components/forms/UserTypeForm";
import EmployeeRoleForm from "../../components/forms/EmployeeRoleForm";
import StatusOptionForm from "../../components/forms/StatusOptionForm";
import ServiceTypeForm from "../../components/forms/ServiceTypeForm";
import InventoryTypeForm from "../../components/forms/InventoryTypeForm";
import DeliverableTypeForm from "../../components/forms/DeliverableTypeForm";
import PriorityOptionForm from "../../components/forms/PriorityOptionForm";
import ServiceCategoryForm from "../../components/forms/ServiceCategoryForm";
import DurationTypeForm from "../../components/forms/DurationTypeForm";

// Import the modal
import CreateModal from "@/components/modals/CreateModal";

// Form configuration type
interface FormConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  component: any;
  badge: string;
  category: string;
}

// All available forms configuration
const formsConfig: FormConfig[] = [
  // Core System
  {
    id: "user-types",
    title: "Tipos de Usuario",
    description: "Configura CLIENT, ADMIN, COLLABORATOR, SUPERADMIN",
    icon: Shield,
    component: UserTypeForm,
    badge: "Core",
    category: "core"
  },
  {
    id: "employee-roles",
    title: "Roles de Empleado",
    description: "Configura CAMAROGRAFO, EDITOR, DISEÑADOR, etc.",
    icon: Briefcase,
    component: EmployeeRoleForm,
    badge: "Core",
    category: "core"
  },
  {
    id: "status-options",
    title: "Estados del Sistema",
    description: "Configura estados para tareas, proyectos, inventario",
    icon: Settings,
    component: StatusOptionForm,
    badge: "Core",
    category: "core"
  },

  // Services
  {
    id: "service-categories",
    title: "Categorías de Servicio",
    description: "Configura AUDIOVISUAL, DISEÑO, MULTIMEDIA, etc.",
    icon: Layers,
    component: ServiceCategoryForm,
    badge: "Services",
    category: "services"
  },
  {
    id: "service-types",
    title: "Tipos de Servicio",
    description: "Configura VIDEO_PROMOCIONAL, PODCAST, LOGO, etc.",
    icon: Video,
    component: ServiceTypeForm,
    badge: "Services",
    category: "services"
  },

  // Operations
  {
    id: "inventory-types",
    title: "Tipos de Inventario",
    description: "Configura CAMARA, AUDIO, ILUMINACION, etc.",
    icon: Package,
    component: InventoryTypeForm,
    badge: "Operations",
    category: "operations"
  },
  {
    id: "deliverable-types",
    title: "Tipos de Entregables",
    description: "Configura VIDEO, AUDIO, IMAGEN, DOCUMENTO, etc.",
    icon: FileText,
    component: DeliverableTypeForm,
    badge: "Operations",
    category: "operations"
  },
  {
    id: "priority-options",
    title: "Opciones de Prioridad",
    description: "Configura BAJA, NORMAL, ALTA, URGENTE, CRITICA",
    icon: AlertTriangle,
    component: PriorityOptionForm,
    badge: "Operations",
    category: "operations"
  },

  // Academic
  {
    id: "duration-types",
    title: "Tipos de Duración",
    description: "Configura TRIMESTRAL, SEMESTRAL, ANUAL, etc.",
    icon: Clock,
    component: DurationTypeForm,
    badge: "Academic",
    category: "academic"
  }
];

const categories = [
  {
    id: "core",
    name: "Sistema Principal",
    description: "Configuraciones fundamentales del sistema",
    icon: Database,
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30"
  },
  {
    id: "services",
    name: "Servicios",
    description: "Configuración de servicios y categorías",
    icon: Video,
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30"
  },
  {
    id: "operations",
    name: "Operaciones",
    description: "Inventario, entregables y prioridades",
    icon: Package,
    color: "from-green-500/20 to-emerald-500/20 border-green-500/30"
  },
  {
    id: "academic",
    name: "Académico",
    description: "Configuraciones específicas del ámbito universitario",
    icon: Clock,
    color: "from-orange-500/20 to-yellow-500/20 border-orange-500/30"
  }
];

const getBadgeVariant = (badge: string) => {
  switch (badge) {
    case "Core": return "bg-purple-900/50 text-purple-300 border-purple-600/50";
    case "Services": return "bg-blue-900/50 text-blue-300 border-blue-600/50";
    case "Operations": return "bg-green-900/50 text-green-300 border-green-600/50";
    case "Academic": return "bg-orange-900/50 text-orange-300 border-orange-600/50";
    default: return "bg-zinc-700 text-zinc-300";
  }
};

export default function GodModeDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = (formId: string) => {
    setActiveModal(formId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      console.log("Form data:", data);
      // Aquí harías la llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      closeModal();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveForm = () => {
    const formConfig = formsConfig.find(f => f.id === activeModal);
    if (!formConfig) return null;

    const FormComponent = formConfig.component;
    return (
      <FormComponent
        onSubmit={handleFormSubmit}
        onCancel={closeModal}
        isLoading={isLoading}
      />
    );
  };

  const getModalTitle = () => {
    const formConfig = formsConfig.find(f => f.id === activeModal);
    return formConfig ? `Crear ${formConfig.title}` : "";
  };

  const getModalDescription = () => {
    const formConfig = formsConfig.find(f => f.id === activeModal);
    return formConfig ? formConfig.description : "";
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Cog className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-sora font-bold text-zinc-100">
                God Mode
              </h1>
              <p className="text-zinc-400 font-poppins text-lg">
                Configuración avanzada del sistema Medialab
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
            <h2 className="text-purple-300 font-poppins font-medium mb-2">
              ⚠️ Zona de Administración Crítica
            </h2>
            <p className="text-purple-200 text-sm font-poppins">
              Estas configuraciones afectan todo el sistema. Solo los SuperAdmins pueden acceder aquí.
              Los cambios se aplicarán inmediatamente a todos los usuarios.
            </p>
          </div>
        </div>

        {/* Categories */}
        {categories.map((category) => {
          const categoryForms = formsConfig.filter(form => form.category === category.id);
          const CategoryIcon = category.icon;

          return (
            <div key={category.id} className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center`}>
                  <CategoryIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-sora font-semibold text-zinc-100">
                    {category.name}
                  </h2>
                  <p className="text-zinc-400 font-poppins">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryForms.map((form) => {
                  const IconComponent = form.icon;
                  
                  return (
                    <Card key={form.id} className="bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800/70 transition-all duration-200">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-700/50 rounded-lg flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-zinc-300" />
                            </div>
                            <div>
                              <CardTitle className="text-zinc-100 font-poppins text-lg">
                                {form.title}
                              </CardTitle>
                            </div>
                          </div>
                          <Badge className={`${getBadgeVariant(form.badge)} text-xs font-poppins border`}>
                            {form.badge}
                          </Badge>
                        </div>
                        <CardDescription className="text-zinc-400 font-poppins text-sm mt-2">
                          {form.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <Button
                          onClick={() => openModal(form.id)}
                          className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-poppins h-11"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Sistema Stats */}
        <div className="mt-16 bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-8">
          <h3 className="text-xl font-sora font-semibold text-zinc-100 mb-6">
            Estado del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 font-mono">
                {formsConfig.filter(f => f.category === 'core').length}
              </div>
              <div className="text-sm text-zinc-400 font-poppins">
                Configuraciones Core
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 font-mono">
                {formsConfig.filter(f => f.category === 'services').length}
              </div>
              <div className="text-sm text-zinc-400 font-poppins">
                Tipos de Servicios
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 font-mono">
                {formsConfig.filter(f => f.category === 'operations').length}
              </div>
              <div className="text-sm text-zinc-400 font-poppins">
                Configuraciones Operativas
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 font-mono">
                {formsConfig.filter(f => f.category === 'academic').length}
              </div>
              <div className="text-sm text-zinc-400 font-poppins">
                Configuraciones Académicas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreateModal
        isOpen={!!activeModal}
        onClose={closeModal}
        title={getModalTitle()}
        description={getModalDescription()}
      >
        {getActiveForm()}
      </CreateModal>
    </div>
  );
}