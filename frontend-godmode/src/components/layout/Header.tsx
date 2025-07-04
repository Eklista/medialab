import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Search,
  User, 
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Header() {
  useTheme();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-700 bg-zinc-900 px-4">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-zinc-300 hover:text-zinc-100" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-600" />
        <div className="flex flex-col">
          <h1 className="font-sora text-lg font-semibold text-zinc-100">
            Panel
          </h1>
          <p className="font-poppins text-xs text-zinc-400">
            Administración del sistema
          </p>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Buscar..."
            className="w-full h-9 pl-10 pr-4 text-sm bg-zinc-800/50 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all font-poppins"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center">
            3
          </span>
          <span className="sr-only">Notificaciones</span>
        </Button>

        <Separator orientation="vertical" className="h-6 bg-zinc-600" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-3 gap-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/70">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center">
                <User className="h-4 w-4 text-zinc-200" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="font-poppins text-sm font-medium text-zinc-100">Admin</span>
                <span className="font-poppins text-xs text-zinc-400">
                  admin@medialab.com
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-800 border-zinc-700">
            <DropdownMenuLabel className="font-sora text-zinc-100">Hola administrador</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-600" />
            <DropdownMenuItem className="text-red-400 hover:bg-zinc-700 focus:bg-zinc-700">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}