# ChatSUA - Frontend Setup Guide

## 📋 Visão Geral

Interface web para o Sistema Unificado de Administração da UNIFESP (ChatSUA). Sistema de gerenciamento de documentos com processamento via RAG usando Google Gemini.

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🔗 Conectando ao Backend FastAPI

### 1. Configurar Variável de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Estrutura de API Esperada

O frontend espera os seguintes endpoints no backend:

#### Upload de Documento
```
POST /api/documents/upload
Content-Type: multipart/form-data
Body: { file: File }

Response: {
  id: string,
  message: string,
  document: {
    id: string,
    name: string,
    original_name: string,
    type: string,
    size: number,
    status: 'processing' | 'completed' | 'error',
    upload_date: string,
    ...
  }
}
```

#### Listar Documentos
```
GET /api/documents

Response: Document[]
```

#### Obter Documento
```
GET /api/documents/:id

Response: Document
```

#### Excluir Documento
```
DELETE /api/documents/:id

Response: 204 No Content
```

#### Baixar Documento
```
GET /api/documents/:id/download

Response: Blob (arquivo)
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── Sidebar.tsx      # Navegação lateral
│   ├── DocumentCard.tsx # Card de documento
│   └── UploadZone.tsx   # Área de upload drag & drop
├── pages/
│   ├── Dashboard.tsx    # Painel principal com estatísticas
│   ├── UploadPage.tsx   # Página de upload
│   ├── DocumentsPage.tsx # Listagem e gerenciamento
│   └── SettingsPage.tsx # Configurações do sistema
├── lib/
│   ├── api.ts          # Serviço de API (configurar aqui)
│   └── mockData.ts     # Dados de exemplo
└── App.tsx             # Roteamento principal
```

## 🎨 Design System

O projeto usa um design system completo definido em:
- `src/index.css` - Variáveis CSS customizadas
- `tailwind.config.ts` - Configuração do Tailwind

### Cores Principais
- **Primary**: Azul acadêmico (HSL 210 85% 45%)
- **Accent**: Azul cyan (HSL 195 85% 50%)
- **Success**: Verde (HSL 142 70% 45%)
- **Warning**: Amarelo (HSL 38 92% 50%)
- **Destructive**: Vermelho (HSL 0 85% 60%)

## 🔧 Desenvolvimento

### Modo de Desenvolvimento com Mock Data

Por padrão, o frontend usa dados mockados (`mockData.ts`) para desenvolvimento. Quando o backend não está disponível, as chamadas de API falham graciosamente com toasts informativos.

### Conectando ao Backend Real

1. Certifique-se de que o backend FastAPI está rodando
2. Configure `VITE_API_URL` no `.env`
3. O frontend automaticamente usará as APIs reais

### Hot Module Replacement (HMR)

O Vite está configurado com HMR para desenvolvimento rápido. As mudanças aparecem instantaneamente sem reload completo da página.

## 📦 Build para Produção

```bash
# Build de produção
npm run build

# Preview do build
npm run preview
```

Os arquivos serão gerados em `dist/`

## 🐳 Docker (Opcional)

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build e run:
```bash
docker build --build-arg VITE_API_URL=http://seu-backend:8000/api -t chatsua-frontend .
docker run -p 80:80 chatsua-frontend
```

## 🔒 Segurança

- Todas as chamadas de API devem usar HTTPS em produção
- Configure CORS no backend para aceitar requisições do frontend
- Implemente autenticação JWT se necessário

## 📝 Próximos Passos

1. ✅ Iniciar backend FastAPI
2. ✅ Configurar variáveis de ambiente
3. ✅ Testar upload de documentos
4. ⬜ Implementar autenticação de usuários
5. ⬜ Adicionar funcionalidade de chat com RAG
6. ⬜ Implementar analytics e métricas

## 🆘 Troubleshooting

### Backend não conecta
- Verifique se o backend está rodando em `http://localhost:8000`
- Confirme que CORS está configurado no backend
- Verifique a variável `VITE_API_URL` no `.env`

### Documentos não aparecem
- Confirme que o endpoint `/api/documents` retorna um array
- Verifique o console do navegador para erros

### Upload falha
- Verifique os logs do backend
- Confirme que MinIO está rodando
- Verifique GEMINI_API_KEY no backend

## 📚 Documentação Adicional

Consulte o arquivo `PLANO.md` na raiz do projeto para o plano completo de desenvolvimento do sistema ChatSUA.

---

**Desenvolvido para UNIFESP** 🎓
