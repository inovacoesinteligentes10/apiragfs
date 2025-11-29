import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function UploadZone({ onFileSelect, isUploading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      setSelectedFile(null);
    }
  }, [selectedFile, onFileSelect]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 transition-all',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          type="file"
          id="file-input"
          className="hidden"
          onChange={handleFileInput}
          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Upload className="w-10 h-10 text-primary" />
          </div>

          <h3 className="text-xl font-semibold mb-2">Faça upload do documento</h3>
          <p className="text-muted-foreground mb-6">
            Arraste e solte seu arquivo aqui ou clique para selecionar
          </p>

          <label htmlFor="file-input">
            <Button variant="default" disabled={isUploading} asChild>
              <span>Selecionar Arquivo</span>
            </Button>
          </label>

          <p className="text-xs text-muted-foreground mt-4">
            Formatos suportados: PDF, DOC, DOCX, TXT, XLSX, XLS
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">{formatBytes(selectedFile.size)}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Enviando...' : 'Enviar'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
