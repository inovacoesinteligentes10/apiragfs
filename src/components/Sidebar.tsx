import { NavLink } from './NavLink';
import { FileText, Upload, Home, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          <span className="gradient-primary bg-clip-text text-transparent">ChatSUA</span>
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Sistema UNIFESP</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        >
          <Home className="w-5 h-5" />
          <span>Painel</span>
        </NavLink>

        <NavLink
          to="/upload"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        >
          <Upload className="w-5 h-5" />
          <span>Upload</span>
        </NavLink>

        <NavLink
          to="/documents"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        >
          <FileText className="w-5 h-5" />
          <span>Documentos</span>
        </NavLink>

        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        >
          <Settings className="w-5 h-5" />
          <span>Configurações</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="px-4 py-3 rounded-lg bg-sidebar-accent/50">
          <p className="text-xs font-medium text-sidebar-foreground">Backend API</p>
          <p className="text-xs text-sidebar-foreground/60 mt-1 truncate">
            {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
          </p>
        </div>
      </div>
    </aside>
  );
}
