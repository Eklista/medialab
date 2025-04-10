// src/features/dashboard/components/layout/SidebarFooter.tsx

import React from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { LockClosedIcon } from '@heroicons/react/24/solid';

const SidebarFooter: React.FC = () => {
  const { lockSession } = useAuth();
  
  const handleLock = () => {
    lockSession();
  };
  
  return (
    <div className="p-4 border-t border-white/10">
      <button
        onClick={handleLock}
        className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-(--color-accent-1)"
      >
        <LockClosedIcon className="h-5 w-5 text-white/80 mr-3" />
        <span>Bloquear sesión</span>
      </button>
      
      <div className="mt-4 text-xs text-white/50 text-center">
        <p>MediaLab Dashboard</p>
        <p>© {new Date().getFullYear()} Univ. Galileo</p>
      </div>
    </div>
  );
};

export default SidebarFooter;