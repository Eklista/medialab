import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Settings,
  Users,
  Camera,
  Video,
  LogOut,
  Crown,
  ChevronDown,
  ChevronRight,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    title: "Servicios",
    icon: Video,
    items: [
      { title: "Tipos de Servicio", url: "/services/types" },
      { title: "Servicios", url: "/services/services" },
    ],
  },
  {
    title: "Inventario",
    icon: Camera,
    items: [
      { title: "Equipo", url: "/equipment/types" },
    ],
  },
  {
    title: "Usuarios",
    icon: Users,
    items: [
      { title: "Usuarios", url: "/users/users" },
      { title: "Roles", url: "/users/roles" },
    ],
  },
  {
    title: "Crud Config",
    icon: List,
    items: [
      { title: "Status", url: "/crud/workflows" },
      { title: "Unidades Academicas", url: "/crud/academic-units" },
      { title: "Locaciones", url: "/crud/locations" },

    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      { title: "Configuración de APP", url: "/config/app" },
      { title: "Configuración SMTP", url: "/config/smtp" },
      { title: "Integraciones", url: "/config/integrations" },
      { title: "API Keys", url: "/config/api-keys" },
      { title: "Logs del Sistema", url: "/config/logs" },
      { title: "Auditoría", url: "/config/audit" },
      { title: "Documentación", url: "/config/docs" },
    ],
  },
  {
    title: "Información",
    icon: Settings,
    items: [
      { title: "Logs del Sistema", url: "/info/logs" },
      { title: "Auditoría", url: "/info/audit" },
      { title: "Documentación", url: "/info/docs" },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Servicios']);

  const isActiveRoute = (url: string) => {
    return location.pathname === url;
  };

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuTitle) 
        ? prev.filter(title => title !== menuTitle)
        : [...prev, menuTitle]
    );
  };

  const isMenuExpanded = (menuTitle: string) => {
    return expandedMenus.includes(menuTitle);
  };


  return (
    <Sidebar className="bg-zinc-900 border-zinc-700">
      <SidebarHeader className="border-b border-zinc-700 p-4 bg-zinc-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="p-2 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-lg shadow-lg">
              <Crown className="h-5 w-5 text-zinc-200" />
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-zinc-400 rounded-full"></div>
          </div>
          <div>
            <span className="font-sora font-bold text-lg text-zinc-100">MEDIALAB</span>
            <p className="font-poppins text-xs text-zinc-400">God Mode Panel</p>
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded-md p-2 border border-zinc-700/50">
          <p className="font-poppins text-xs text-zinc-300">Bienvenido</p>
          <p className="font-poppins text-xs text-zinc-500">Administrador del sistema</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-zinc-900 p-2 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {!item.items ? (
                    <SidebarMenuButton 
                      asChild
                      isActive={isActiveRoute(item.url!)}
                      className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/70 data-[active=true]:bg-gradient-to-r data-[active=true]:from-zinc-700 data-[active=true]:to-zinc-800 data-[active=true]:text-zinc-100 font-poppins rounded-lg h-10 px-3 transition-all duration-200"
                    >
                      <Link to={item.url!}>
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <div className="space-y-1">
                      <SidebarMenuButton 
                        onClick={() => toggleMenu(item.title)}
                        className="w-full text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/70 font-poppins rounded-lg h-10 px-3 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </div>
                          {isMenuExpanded(item.title) ? (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                          )}
                        </div>
                      </SidebarMenuButton>
                      
                      {isMenuExpanded(item.title) && (
                        <SidebarGroup className="ml-3">
                          <SidebarGroupContent>
                            <SidebarMenu className="space-y-0.5">
                              {item.items.map((subItem) => (
                                <SidebarMenuItem key={subItem.title}>
                                  <SidebarMenuButton 
                                    asChild
                                    isActive={isActiveRoute(subItem.url)}
                                    className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 data-[active=true]:bg-zinc-700/70 data-[active=true]:text-zinc-100 font-poppins rounded-md h-9 px-3 transition-all duration-200 relative before:absolute before:left-[-12px] before:top-1/2 before:w-2 before:h-px before:bg-zinc-600 before:transform before:-translate-y-1/2"
                                  >
                                    <Link to={subItem.url}>
                                      <span className="text-sm font-medium">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                      )}
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-700 p-3 bg-zinc-900">
        <div className="bg-zinc-800/30 rounded-md p-0.5">
          <Button variant="ghost" className="w-full justify-start gap-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/70 font-poppins h-9 transition-all duration-200">
            <div className="p-1 bg-zinc-700 rounded-sm">
              <LogOut className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}