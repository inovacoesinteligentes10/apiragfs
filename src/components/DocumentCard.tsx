import { Document } from '@/lib/api';
import { Card } from './ui/card';
import { FileText, Download, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentCardProps {
  document: Document;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export function DocumentCard({ document, onDelete, onDownload }: DocumentCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (document.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-warning animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case 'completed':
        return <Badge variant="default" className="bg-success hover:bg-success">Completo</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-warning hover:bg-warning">Processando</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-smooth">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <FileText className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-foreground truncate">{document.original_name}</h3>
            {getStatusBadge()}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              {getStatusIcon()}
              {document.status === 'completed' && document.chunks && (
                <span>{document.chunks} chunks</span>
              )}
            </span>
            <span>{formatBytes(document.size)}</span>
            <span>
              {formatDistanceToNow(new Date(document.upload_date), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>

          {document.status === 'completed' && document.text_length && (
            <div className="text-xs text-muted-foreground mb-3">
              {document.text_length.toLocaleString()} caracteres extraídos
              {document.processing_time && ` em ${(document.processing_time / 1000).toFixed(1)}s`}
            </div>
          )}

          {document.status === 'error' && document.error_message && (
            <div className="text-sm text-destructive mb-3">{document.error_message}</div>
          )}

          <div className="flex gap-2">
            {document.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload?.(document.id)}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete?.(document.id)}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
