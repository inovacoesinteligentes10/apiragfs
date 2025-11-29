import { useState } from 'react';
import { DocumentCard } from '@/components/DocumentCard';
import { mockDocuments } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';

export default function DocumentsPage() {
  const [documents] = useState(mockDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.original_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteDocument(id);
      toast.success('Documento excluído com sucesso!');
    } catch (error) {
      toast.error('Backend não disponível', {
        description: 'Não foi possível excluir o documento.',
      });
      console.error('Delete error:', error);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const blob = await apiService.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Backend não disponível', {
        description: 'Não foi possível baixar o documento.',
      });
      console.error('Download error:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Documentos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os documentos enviados ao sistema
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Completo</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum documento encontrado</p>
          </div>
        )}
      </div>

      {filteredDocuments.length > 0 && (
        <div className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredDocuments.length} de {documents.length} documentos
          </p>
        </div>
      )}
    </div>
  );
}
