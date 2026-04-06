// src/components/ui/UserMenu.tsx
import { User, LogOut } from 'lucide-react';

interface UserMenuProps {
  userEmail: string | undefined;
  onLogoutClick: () => void;
}

export default function UserMenu({ userEmail, onLogoutClick }: UserMenuProps) {
  return (
    <div className="flex items-center justify-between w-full px-2 py-1.5">
      {/* INFO DEL USUARIO */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-7 h-7 shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 shadow-sm border border-blue-200">
          <User className="w-4 h-4" />
        </div>
        <div className="flex flex-col text-left overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">
            Cuenta conectada
          </span>
          <span
            className="text-xs font-semibold text-slate-700 truncate leading-none"
            title={userEmail}
          >
            {userEmail?.split('@')[0]}
          </span>
        </div>
      </div>

      {/* BOTÓN DE CERRAR SESIÓN */}
      <button
        onClick={onLogoutClick}
        title="Cerrar Sesión"
        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
