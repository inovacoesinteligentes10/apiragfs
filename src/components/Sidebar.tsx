import { Link, useLocation } from 'react-router-dom';
import { FileText, Home, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">DocRAG</h1>
            <p className="text-xs text-muted-foreground">Document Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/dashboard"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            isActive('/dashboard')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>

        <Link
          to="/upload"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            isActive('/upload')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium">Upload</span>
        </Link>

        <Link
          to="/documents"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            isActive('/documents')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Documentos</span>
        </Link>

        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            isActive('/settings')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Configurações</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          © 2024 DocRAG
        </p>
      </div>
    </aside>
  );
}
