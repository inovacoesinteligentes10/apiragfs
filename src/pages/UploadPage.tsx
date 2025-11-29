import { useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);

    try {
      // Attempt to upload to backend
      const response = await apiService.uploadDocument(file);
      toast.success('Upload realizado com sucesso!', {
        description: `Documento ${response.document.name} está sendo processado.`,
      });
    } catch (error) {
      // If backend is not available, show helpful error
      toast.error('Backend não disponível', {
        description: 'Configure VITE_API_URL ou inicie o servidor FastAPI.',
      });
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload de Documentos</h1>
        <p className="text-muted-foreground">
          Envie documentos para processamento e indexação no ChatSUA
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Conexão com Backend</AlertTitle>
        <AlertDescription>
          Esta interface está pronta para conectar com seu servidor FastAPI. Configure a variável
          <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">VITE_API_URL</code>
          no seu ambiente de desenvolvimento.
        </AlertDescription>
      </Alert>

      <Card className="p-8">
        <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Processo de Upload</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">1. Seleção do Arquivo</h3>
              <p className="text-sm text-muted-foreground">
                Escolha o documento que deseja enviar através do drag & drop ou seleção manual
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">2. Upload para MinIO</h3>
              <p className="text-sm text-muted-foreground">
                O arquivo é enviado para o bucket MinIO configurado no backend
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">3. Processamento com Gemini</h3>
              <p className="text-sm text-muted-foreground">
                O documento é processado e indexado usando Google Gemini File Search API
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">4. Disponível para Consulta</h3>
              <p className="text-sm text-muted-foreground">
                Após o processamento, o documento fica disponível para consultas via RAG
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Alert variant="default" className="border-warning/50 bg-warning/5">
        <AlertCircle className="h-4 w-4 text-warning" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Certifique-se de que o backend FastAPI está em execução e que as variáveis de ambiente
          (GEMINI_API_KEY, configurações do MinIO) estão corretamente configuradas.
        </AlertDescription>
      </Alert>
    </div>
  );
}
