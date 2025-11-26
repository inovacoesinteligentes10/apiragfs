# 🎯 Próximas Melhorias - APIRagFST

**Data**: 2025-11-26
**Status do Projeto**: Backend 100% | Frontend 60% conectado

---

## 🔴 **ALTA PRIORIDADE - Próximas 2 Semanas**

### 1. **Conectar Analytics com Backend Real** ⭐⭐⭐
**Prioridade**: CRÍTICA | **Tempo Estimado**: 2-3 horas

**Problema Atual**:
- Frontend usa dados mockados no componente Analytics
- Backend já tem todos os endpoints implementados ✅
- Falta apenas conectar os pontos

**O que fazer**:
```typescript
// services/apiService.ts - ADICIONAR:

export interface AnalyticsDashboard {
    total_documents: number;
    completed_documents: number;
    total_chat_sessions: number;
    total_messages: number;
    documents_by_type: Array<{type: string, count: number}>;
    activity_last_7_days: Array<{date: string, count: number}>;
    timestamp: string;
}

export interface AnalyticsStats {
    total_storage_bytes: number;
    total_storage_mb: number;
    avg_processing_time_seconds: number;
    total_chunks: number;
    active_chat_sessions: number;
}

// Adicionar métodos:
async getAnalyticsDashboard(userId: string): Promise<AnalyticsDashboard>
async getAnalyticsStats(userId: string): Promise<AnalyticsStats>
async getAnalyticsActivity(days: number, userId: string)
async getTopQueries(limit: number, userId: string)
```

**Atualizar Componente**:
```tsx
// components/Analytics.tsx
// Substituir dados mockados por:
const [metrics, setMetrics] = useState<AnalyticsDashboard | null>(null);

useEffect(() => {
    apiService.getAnalyticsDashboard(userId)
        .then(data => setMetrics(data));
}, [userId]);
```

**Endpoints Disponíveis**:
- ✅ `GET /api/v1/analytics/dashboard?user_id={id}`
- ✅ `GET /api/v1/analytics/stats?user_id={id}`
- ✅ `GET /api/v1/analytics/activity?days=30&user_id={id}`
- ✅ `GET /api/v1/analytics/queries?limit=10&user_id={id}`

---

### 2. **Implementar Autenticação JWT Completa** 🔐
**Prioridade**: ALTA | **Tempo Estimado**: 1 semana

**Status Atual**:
- Sistema multi-user já existe (tabela `users`)
- Endpoints usam `user_id` como parâmetro
- Falta autenticação real

**Implementar no Backend**:

#### Schemas de Auth
```python
# backend/app/schemas/auth.py
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
```

#### Endpoints de Auth
```python
# backend/app/api/v1/auth.py
POST   /api/v1/auth/register      # Registro de usuário
POST   /api/v1/auth/login         # Login (retorna JWT)
POST   /api/v1/auth/refresh       # Refresh token
POST   /api/v1/auth/logout        # Invalidar token
GET    /api/v1/auth/me            # Dados do usuário atual
```

#### Middleware JWT
```python
# backend/app/middleware/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    # Validar JWT e retornar user
    pass
```

#### Proteger Rotas
```python
# Substituir user_id: str = "default-user" por:
current_user: dict = Depends(get_current_user)
```

**Implementar no Frontend**:

```typescript
// services/authService.ts - CRIAR
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

class AuthService {
    async login(credentials: LoginCredentials): Promise<LoginResponse>
    async logout(): Promise<void>
    async refreshToken(): Promise<string>
    getCurrentUser(): AuthUser | null
    getToken(): string | null
    isAuthenticated(): boolean
}
```

```tsx
// Context para Auth
// contexts/AuthContext.tsx
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Verificar token ao carregar
    // Refresh automático
    // Login/Logout
}
```

**Componentes**:
- `components/LoginForm.tsx` - Tela de login
- `components/ProtectedRoute.tsx` - Proteção de rotas
- `components/UserMenu.tsx` - Menu do usuário

---

### 3. **Melhorar UX com Estados de Loading e Erro** ⚡
**Prioridade**: ALTA | **Tempo Estimado**: 2-3 dias

**Implementar**:

#### Loading States
```tsx
// components/LoadingStates.tsx
export const DocumentsTableSkeleton = () => (
    // Skeleton loading para tabela
);

export const ChatSkeleton = () => (
    // Skeleton para chat
);

export const AnalyticsSkeleton = () => (
    // Skeleton para analytics
);
```

#### Error Handling
```tsx
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
    // Capturar erros de renderização
}

// components/ErrorMessage.tsx
export const ErrorMessage = ({error, retry}) => (
    <div className="error-container">
        <AlertCircle />
        <p>{error.message}</p>
        <button onClick={retry}>Tentar Novamente</button>
    </div>
);
```

#### Toast Notifications
```typescript
// utils/toast.ts
import { toast } from 'sonner'; // ou react-hot-toast

export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
export const showInfo = (message: string) => toast.info(message);
```

**Usar em toda aplicação**:
```tsx
// Exemplo em DocumentsView
const handleUpload = async (file: File) => {
    try {
        setLoading(true);
        const result = await apiService.uploadDocument(file);
        showSuccess(`Documento ${file.name} enviado com sucesso!`);
    } catch (error) {
        showError(`Erro ao enviar documento: ${error.message}`);
    } finally {
        setLoading(false);
    }
};
```

---

### 4. **Implementar Upload com Progress Bar Real** 📤
**Prioridade**: ALTA | **Tempo Estimado**: 1 dia

**Problema Atual**:
- Upload mostra progresso genérico
- Não mostra progresso real do backend

**Implementar**:

```typescript
// services/apiService.ts
async uploadDocument(
    file: File,
    userId: string,
    department?: string,
    onProgress?: (progress: number) => void
): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    if (department) formData.append('department', department);

    const response = await fetch(`${this.baseUrl}/api/v1/documents/upload`, {
        method: 'POST',
        body: formData,
    });

    // Polling de status do documento
    const doc = await response.json();

    if (onProgress) {
        await this.pollDocumentStatus(doc.id, onProgress);
    }

    return doc;
}

private async pollDocumentStatus(
    docId: string,
    onProgress: (progress: number) => void
) {
    let status = 'processing';

    while (status !== 'completed' && status !== 'error') {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const doc = await this.getDocument(docId);
        status = doc.status;

        if (doc.progress_percent) {
            onProgress(doc.progress_percent);
        }
    }
}
```

**Componente**:
```tsx
// components/DocumentUpload.tsx
const [uploadProgress, setUploadProgress] = useState(0);

const handleUpload = async (file: File) => {
    await apiService.uploadDocument(
        file,
        userId,
        department,
        (progress) => setUploadProgress(progress)
    );
};

// Render:
{uploadProgress > 0 && (
    <ProgressBar
        progress={uploadProgress}
        message={`Processando documento... ${uploadProgress}%`}
    />
)}
```

---

## 🟡 **MÉDIA PRIORIDADE - Próximo Mês**

### 5. **Chat com Streaming Real** 💬
**Prioridade**: MÉDIA | **Tempo Estimado**: 3-4 dias

**Implementar SSE (Server-Sent Events)**:

```python
# backend/app/api/v1/chat.py
from fastapi.responses import StreamingResponse

@router.post("/sessions/{session_id}/stream")
async def stream_chat_response(
    session_id: str,
    message: str,
    current_user: dict = Depends(get_current_user)
):
    async def event_generator():
        gemini_service = GeminiService()

        async for chunk in gemini_service.stream_chat(message, rag_store):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

```typescript
// Frontend com EventSource
const streamChat = async (message: string, sessionId: string) => {
    const eventSource = new EventSource(
        `${API_URL}/api/v1/chat/sessions/${sessionId}/stream?message=${message}`
    );

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.done) {
            eventSource.close();
        } else {
            // Append chunk to message
            updateStreamingMessage(data.chunk);
        }
    };
};
```

---

### 6. **Busca e Filtros Avançados** 🔍
**Prioridade**: MÉDIA | **Tempo Estimado**: 1 semana

**Implementar no Backend**:
```python
@router.get("/documents/search")
async def search_documents(
    q: str,  # Query de busca
    type: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    sort_by: str = "upload_date",
    order: str = "desc",
    skip: int = 0,
    limit: int = 50
):
    # Busca com PostgreSQL full-text search
    pass
```

**Frontend**:
```tsx
// components/DocumentFilters.tsx
export const DocumentFilters = ({onFilter}) => (
    <div className="filters">
        <input type="text" placeholder="Buscar..." />
        <select name="type">...</select>
        <select name="department">...</select>
        <DateRangePicker />
    </div>
);
```

---

### 7. **Preview de Documentos** 👁️
**Prioridade**: MÉDIA | **Tempo Estimado**: 1 semana

**Implementar**:
- PDF Viewer (react-pdf)
- Markdown Viewer
- Text Viewer
- Syntax highlighting para código

```tsx
// components/DocumentPreview.tsx
export const DocumentPreview = ({documentId}) => {
    const [content, setContent] = useState<string>('');
    const [type, setType] = useState<string>('');

    // Render baseado no tipo
    if (type === 'pdf') return <PDFViewer url={url} />;
    if (type === 'md') return <MarkdownViewer content={content} />;
    return <TextViewer content={content} />;
};
```

---

### 8. **Exportar Conversas** 📥
**Prioridade**: MÉDIA | **Tempo Estimado**: 2-3 dias

**Implementar**:
```python
@router.get("/chat/sessions/{session_id}/export")
async def export_chat_session(
    session_id: str,
    format: str = "pdf",  # pdf, txt, json, md
    current_user: dict = Depends(get_current_user)
):
    # Gerar PDF/TXT/JSON/MD da conversa
    pass
```

**Frontend**:
```tsx
<button onClick={() => exportChat(sessionId, 'pdf')}>
    Exportar como PDF
</button>
```

---

## 🟢 **BAIXA PRIORIDADE - Futuro**

### 9. **Versionamento de Documentos**
- Histórico de versões
- Diff entre versões
- Rollback

### 10. **Compartilhamento de Documentos**
- Link público temporário
- Compartilhar com outros usuários
- Permissões granulares

### 11. **Tags e Categorização Avançada**
- Tags customizadas
- Categorias hierárquicas
- Auto-tagging com IA

### 12. **Dashboard Personalizado**
- Widgets configuráveis
- Métricas customizadas
- Exportar relatórios

### 13. **Integração com N8N**
- Workflows automáticos
- Triggers em eventos
- Actions customizadas

### 14. **PWA e Offline Mode**
- Service Worker
- Cache offline
- Sincronização

### 15. **Testes Automatizados**
- Unit tests (Backend)
- Integration tests
- E2E tests (Playwright)
- CI/CD pipeline

---

## 📊 Roadmap Visual

```
┌─────────────────────────────────────────────────────────────┐
│ SEMANA 1-2: Conectar Frontend com Backend                  │
│ ├─ Analytics com dados reais                               │
│ ├─ Upload com progress real                                │
│ └─ Loading states e error handling                         │
├─────────────────────────────────────────────────────────────┤
│ SEMANA 3-4: Autenticação e Segurança                       │
│ ├─ JWT Backend                                             │
│ ├─ Auth Context Frontend                                   │
│ ├─ Login/Logout                                            │
│ └─ Protected routes                                        │
├─────────────────────────────────────────────────────────────┤
│ MÊS 2: Features Avançadas                                  │
│ ├─ Chat streaming                                          │
│ ├─ Busca avançada                                          │
│ ├─ Preview de documentos                                   │
│ └─ Exportar conversas                                      │
├─────────────────────────────────────────────────────────────┤
│ MÊS 3+: Polish e Otimização                                │
│ ├─ Versionamento                                           │
│ ├─ Compartilhamento                                        │
│ ├─ PWA                                                     │
│ └─ Testes                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Priorização de Esforço vs Impacto

```
Alto Impacto, Baixo Esforço (FAZER PRIMEIRO):
  1. ✅ Conectar Analytics
  2. ✅ Upload com progress
  3. ✅ Loading states

Alto Impacto, Alto Esforço (FAZER EM SEGUIDA):
  4. ⬜ Autenticação JWT
  5. ⬜ Chat streaming
  6. ⬜ Busca avançada

Baixo Impacto, Baixo Esforço (FAZER SE SOBRAR TEMPO):
  7. ⬜ Exportar conversas
  8. ⬜ Preview documentos

Baixo Impacto, Alto Esforço (EVITAR OU DEIXAR PARA DEPOIS):
  9. ⬜ PWA offline
  10. ⬜ Versionamento complexo
```

---

## 🚀 Como Começar

### Próxima Sessão de Desenvolvimento:

1. **Conectar Analytics** (2-3h)
   ```bash
   # Criar feature branch
   git checkout -b feature/connect-analytics-frontend

   # Editar services/apiService.ts
   # Editar components/Analytics.tsx
   # Testar

   # Commit e merge
   git commit -m "feat: connect analytics to backend API"
   ```

2. **Upload com Progress** (4-6h)
   ```bash
   git checkout -b feature/real-upload-progress

   # Implementar polling de status
   # Atualizar componente de upload
   # Testar com documentos grandes
   ```

3. **Loading States** (4-6h)
   ```bash
   git checkout -b feature/loading-states

   # Criar skeletons
   # Adicionar em todos os componentes
   # Melhorar UX
   ```

---

**Próxima Melhoria Recomendada**: Conectar Analytics com Backend (mais rápido e mais impacto visual)
