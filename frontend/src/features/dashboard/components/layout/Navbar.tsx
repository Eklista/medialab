// src/features/dashboard/components/layout/Navbar.tsx
import React from 'react';
import { useCurrentUser, getTimeBasedGreeting } from '../../utils/userUtils';

// Apple Emojis
import { EmojiProvider, Emoji } from 'react-apple-emojis';
import emojiData from 'react-apple-emojis/src/data.json';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { user: currentUser } = useCurrentUser();
 
  // Función para obtener el primer nombre de manera segura
  const getFirstName = () => {
    if (!currentUser) return 'Usuario';
   
    // Priorizar firstName, luego extraer de email si no existe
    if (currentUser.firstName) {
      return currentUser.firstName;
    }
   
    if (currentUser.email) {
      return currentUser.email.split('@')[0];
    }
   
    return 'Usuario';
  };

  // Función para obtener el emoji apropiado según la hora
  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return "waving hand"; // 👋 Buenos días
    } else if (hour >= 12 && hour < 18) {
      return "victory hand"; // ✌️ Buenas tardes  
    } else if (hour >= 18 && hour < 22) {
      return "ok hand"; // 👌 Buenas tardes/noches
    } else {
      return "call me hand"; // 🤙 Buenas noches
    }
  };
 
  return (
    <EmojiProvider data={emojiData}>
      <div className={`px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)] bg-white ${className || ''}`}>
        {/* Saludo y mensaje de bienvenida */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[var(--color-text-main)] mb-1 flex items-center gap-2">
            {getTimeBasedGreeting()}, {getFirstName()}!
            <Emoji name={getGreetingEmoji()} width={24} />
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Revisa tus proyectos, tareas o solicitudes de hoy
          </p>
        </div>
      </div>
    </EmojiProvider>
  );
};

export default Navbar;