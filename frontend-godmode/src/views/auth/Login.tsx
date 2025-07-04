// views/auth/Login.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03),transparent_50%)]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-zinc-700/50 shadow-2xl bg-zinc-800/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-2xl shadow-lg">
                  <Crown className="h-8 w-8 text-zinc-200" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-400 rounded-full"></div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="font-sora text-2xl text-zinc-100">
                Modo Dios
              </CardTitle>
              <CardDescription className="font-poppins text-zinc-400">
                Panel de administración avanzado
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-poppins text-sm text-zinc-300">
                Correo electrónico
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@medialab.com"
                className="font-poppins bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/20 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-poppins text-sm text-zinc-300">
                Contraseña
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="font-poppins bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/20 h-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button className="w-full h-11 bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600 text-zinc-100 font-poppins font-medium shadow-lg transition-all duration-200">
              Acceder al Panel
            </Button>

            <div className="text-center pt-2">
              <a href="#" className="font-poppins text-sm text-zinc-500 hover:text-zinc-400 transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Elegant footer */}
        <div className="mt-8 text-center">
          <p className="font-poppins text-sm text-zinc-500">
            Medialab © 2025 · Acceso restringido
          </p>
        </div>
      </div>
    </div>
  );
}