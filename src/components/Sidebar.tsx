import { Layout, FolderKanban, LogOut, User } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: 'dashboard' | 'tasks' | 'projects';
  onTabChange: (tab: 'dashboard' | 'tasks' | 'projects') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { profile, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: Layout, label: 'Dashboard' },
    { id: 'tasks', icon: FolderKanban, label: 'Tasks' },
    { id: 'projects', icon: FolderKanban, label: 'Projects' },
  ];

  return (
    <div className="w-64 bg-white/95 backdrop-blur border-r border-[var(--color-brand-line)] flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl">
            T
          </div>
          <span className="font-bold text-xl tracking-tight">TaskFlow</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                activeTab === item.id
                  ? "bg-black text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-[var(--color-brand-line)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.displayName}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{profile?.role}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
