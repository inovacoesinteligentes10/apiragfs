import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Server, Database, Key } from 'lucide-react';

export default function SettingsPage() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Configure as integrações e parâmetros do sistema
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Configuração de Ambiente</AlertTitle>
        <AlertDescription>
          Para conectar ao backend, crie um arquivo <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">.env</code> na raiz do projeto
          com a variável <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">VITE_API_URL</code>
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Backend API</h2>
            <p className="text-sm text-muted-foreground">Configurações do servidor FastAPI</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">URL da API</Label>
            <Input
              id="api-url"
              value={apiUrl}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Configurado via variável de ambiente VITE_API_URL
            </p>
          </div>

          <div className="space-y-2">
            <Label>Status da Conexão</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span className="text-sm">Aguardando conexão com backend</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <Database className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">MinIO Storage</h2>
            <p className="text-sm text-muted-foreground">Armazenamento de documentos</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bucket</Label>
            <Input value="chatsua-documents" readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Input value="http://localhost:9000" readOnly className="bg-muted" />
          </div>

          <p className="text-xs text-muted-foreground">
            Configurado no backend via variáveis de ambiente
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-success/10">
            <Key className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Google Gemini</h2>
            <p className="text-sm text-muted-foreground">Integração com IA</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value="••••••••••••••••"
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Configurado no backend via GEMINI_API_KEY
            </p>
          </div>

          <div className="space-y-2">
            <Label>Modelo</Label>
            <Input value="gemini-1.5-pro" readOnly className="bg-muted" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">Configuração do Backend</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-medium">Clonar o repositório backend</p>
              <code className="text-xs text-muted-foreground block mt-1">
                git clone [seu-repo-backend]
              </code>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-medium">Configurar variáveis de ambiente</p>
              <code className="text-xs text-muted-foreground block mt-1">
                cp .env.example .env
              </code>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-medium">Iniciar serviços com Docker</p>
              <code className="text-xs text-muted-foreground block mt-1">
                make docker-up
              </code>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">4</span>
            </div>
            <div>
              <p className="font-medium">Iniciar servidor FastAPI</p>
              <code className="text-xs text-muted-foreground block mt-1">
                uvicorn app.main:app --reload
              </code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
