import { Card } from '@/components/ui/card';
import { FileText, Upload, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { mockDocuments } from '@/lib/mockData';

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = {
    total: mockDocuments.length,
    completed: mockDocuments.filter(d => d.status === 'completed').length,
    processing: mockDocuments.filter(d => d.status === 'processing').length,
    totalSize: mockDocuments.reduce((acc, doc) => acc + doc.size, 0),
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Painel de Controle</h1>
        <p className="text-muted-foreground">
          Sistema de Gerenciamento de Documentos - ChatSUA UNIFESP
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total de Documentos</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Processados</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.processing}</p>
            <p className="text-sm text-muted-foreground">Em Processamento</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Upload className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatBytes(stats.totalSize)}</p>
            <p className="text-sm text-muted-foreground">Armazenamento</p>
          </div>
        </Card>
      </div>

      <Card className="p-8">
        <h2 className="text-xl font-semibold mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/upload')}
            className="h-auto py-6 flex-col gap-2"
          >
            <Upload className="w-8 h-8" />
            <div>
              <div className="font-semibold">Fazer Upload</div>
              <div className="text-xs opacity-90">Enviar novo documento</div>
            </div>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/documents')}
            className="h-auto py-6 flex-col gap-2"
          >
            <FileText className="w-8 h-8" />
            <div>
              <div className="font-semibold">Ver Documentos</div>
              <div className="text-xs opacity-90">Gerenciar arquivos existentes</div>
            </div>
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Documentos Recentes</h2>
        <div className="space-y-3">
          {mockDocuments.slice(0, 5).map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer"
              onClick={() => navigate('/documents')}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.original_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(doc.size)} • {doc.status}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(doc.upload_date).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
