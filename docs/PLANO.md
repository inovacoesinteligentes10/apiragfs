# 📋 Plano de Desenvolvimento - ChatSUA

**Sistema Unificado de Administração da UNIFESP**
**Assistente RAG com Google Gemini**

---

## 📊 Status Atual do Projeto

### ✅ Componentes Implementados

#### **Frontend React + TypeScript**
- [x] Sidebar categorizada (Principal, Ferramentas, Sistema)
- [x] Dashboard com estatísticas e ações rápidas
- [x] Sistema de upload de documentos com drag & drop
- [x] Tabela de documentos com paginação e ordenação
- [x] Chat IA com interface moderna e avatares
- [x] Analytics com gráficos de linhas e barras
- [x] Status dos serviços com monitoramento
- [x] Página de configurações completa

#### **Infraestrutura**
- [x] MinIO configurado (docker-compose.yml)
- [x] Makefile com automação
- [x] Serviço de integração MinIO (minioService.ts)
- [x] Rede Docker stack-network
- [x] Hot Module Replacement (HMR) funcionando

#### **Integração Gemini**
- [x] Serviço geminiService.ts
- [x] Prompts especializados para ChatSUA/UNIFESP
- [x] Upload para RAG Store
- [x] File Search API integrada
- [x] Geração de perguntas exemplo

---

## 🎯 Roadmap de Desenvolvimento

### **FASE 1: Fundação Backend** 🟢 Em Andamento
**Prazo Estimado: 1-2 semanas**

#### 1.1 Infraestrutura Base ✅ COMPLETO
- [x] Iniciar MinIO (`make minio-up`)
- [x] Verificar MinIO Console (http://localhost:9001)
- [x] Criar bucket `chatsua-documents`
- [x] Configurar GEMINI_API_KEY em `.env.local`
- [x] Adicionar PostgreSQL ao docker-compose
- [x] ~~Adicionar Qdrant ao docker-compose~~ (não necessário - usando Gemini File Search API)
- [x] Adicionar Redis ao docker-compose
- [x] Atualizar Makefile para docker compose v2
- [x] Criar documentação de portas (docs/PORTAS.md)
- [x] Verificar healthcheck de todos os serviços

#### 1.2 Banco de Dados PostgreSQL ✅ COMPLETO
- [x] Schema criado em `backend/database/init.sql`
- [x] Extensão uuid-ossp habilitada
- [x] Tabelas: users, documents, chat_sessions, messages, analytics_events
- [x] Índices criados para otimização
- [x] Triggers para updated_at automático
- [x] Usuários de teste inseridos

**Schema Principal:**

```sql
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'student', 'professor', 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documentos
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    size BIGINT NOT NULL,
    minio_url VARCHAR(500) NOT NULL,
    minio_bucket VARCHAR(100) DEFAULT 'chatsua-documents',
    text_length INTEGER,
    extraction_method VARCHAR(100),
    chunks INTEGER,
    processing_time INTEGER,
    status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'error'
    error_message TEXT,
    upload_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessões de Chat
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    document_name VARCHAR(255),
    rag_store_name VARCHAR(255),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Mensagens
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'model'
    content TEXT NOT NULL,
    grounding_chunks JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'query', 'upload', 'session_start', etc.
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_started_at ON chat_sessions(started_at DESC);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
```

#### 1.3 API Backend (FastAPI + Python + Pydantic) 🔴 PENDENTE
- [x] Estrutura de pastas criada
- [ ] Inicializar projeto Python com UV no backend/
- [ ] Criar pyproject.toml com dependências
- [ ] Instalar dependências (fastapi, uvicorn, asyncpg, redis, minio, google-generativeai)
- [ ] Criar main.py com aplicação FastAPI
- [ ] Implementar configurações (database, redis, minio, gemini)
- [ ] Implementar routers (auth, documents, chat, analytics)
- [ ] Implementar services/dependencies
- [ ] Implementar models com Pydantic
- [ ] Implementar middleware (CORS, auth, errors)
- [ ] Criar Dockerfile multistage para backend
- [ ] Adicionar backend ao docker-compose.yml com healthcheck

**Estrutura de Pastas (FastAPI):**

```
backend/
├── app/
│   ├── main.py                   # Aplicação FastAPI principal
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py           # Configurações (Pydantic Settings)
│   │   ├── database.py           # Pool de conexões PostgreSQL
│   │   ├── redis.py              # Configuração Redis
│   │   └── minio.py              # Cliente MinIO
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py               # Dependencies (DB, Redis, Auth)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py           # Router de autenticação
│   │       ├── documents.py      # Router de documentos
│   │       ├── chat.py           # Router de chat
│   │       └── analytics.py      # Router de analytics
│   ├── services/
│   │   ├── __init__.py
│   │   ├── minio_service.py      # Serviço MinIO
│   │   ├── gemini_service.py     # Serviço Gemini AI
│   │   └── analytics_service.py  # Serviço Analytics
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py               # Modelo Pydantic User
│   │   ├── document.py           # Modelo Pydantic Document
│   │   ├── chat.py               # Modelos Chat/Message
│   │   └── analytics.py          # Modelos Analytics
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py               # Schemas de requisição/resposta
│   │   ├── document.py
│   │   ├── chat.py
│   │   └── analytics.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py               # Middleware de autenticação
│   │   └── error_handler.py      # Tratamento de erros
│   └── utils/
│       ├── __init__.py
│       ├── security.py           # JWT, hashing
│       └── database.py           # Helpers de DB
├── database/
│   └── init.sql                  # Schema PostgreSQL
├── tests/
│   ├── __init__.py
│   ├── test_api.py
│   └── test_services.py
├── pyproject.toml                # Dependências UV
├── Dockerfile                    # Dockerfile multistage
└── .python-version               # Versão do Python
```

**Endpoints API (FastAPI):**

```python
# Autenticação
POST   /api/v1/auth/login            # Login usuário
POST   /api/v1/auth/register         # Registro
POST   /api/v1/auth/logout           # Logout
GET    /api/v1/auth/me               # Usuário atual

# Documentos
POST   /api/v1/documents/upload      # Upload para MinIO + processamento
GET    /api/v1/documents             # Listar documentos (com paginação)
GET    /api/v1/documents/{id}        # Detalhes do documento
DELETE /api/v1/documents/{id}        # Deletar documento
GET    /api/v1/documents/{id}/download # Pre-signed URL para download

# Chat
POST   /api/v1/chat/sessions         # Criar sessão
GET    /api/v1/chat/sessions         # Listar sessões
GET    /api/v1/chat/sessions/{id}    # Detalhes da sessão
DELETE /api/v1/chat/sessions/{id}    # Encerrar sessão
POST   /api/v1/chat/sessions/{id}/messages  # Enviar mensagem
GET    /api/v1/chat/sessions/{id}/messages  # Histórico
POST   /api/v1/chat/stream           # Chat com streaming (SSE)

# Analytics
GET    /api/v1/analytics/dashboard   # Métricas do dashboard
GET    /api/v1/analytics/activity    # Atividade ao longo do tempo
GET    /api/v1/analytics/models      # Uso de modelos LLM
GET    /api/v1/analytics/queries     # Top queries
POST   /api/v1/analytics/export      # Exportar relatórios

# Sistema
GET    /api/v1/system/status         # Status dos serviços
GET    /api/v1/health                # Healthcheck
GET    /docs                         # Swagger UI (automático)
GET    /redoc                        # ReDoc (automático)
```

---

### **FASE 2: Integração Frontend-Backend** 🟡 Alta Prioridade
**Prazo Estimado: 1 semana**

#### 2.1 Atualizar Frontend
- [ ] Criar cliente API (axios/fetch)
- [ ] Adicionar gerenciamento de estado (Context API ou Zustand)
- [ ] Implementar autenticação no frontend
- [ ] Conectar DocumentsView com API real
- [ ] Conectar ChatInterface com API real
- [ ] Conectar Analytics com dados reais
- [ ] Conectar StatusView com healthcheck real

#### 2.2 Integração MinIO
- [ ] Atualizar `minioService.ts` para usar SDK real
- [ ] Implementar upload direto para MinIO
- [ ] Implementar pre-signed URLs para download
- [ ] Adicionar preview de documentos

#### 2.3 Integração Gemini
- [ ] Mover processamento RAG para backend
- [ ] Implementar streaming de respostas
- [ ] Adicionar retry logic
- [ ] Implementar rate limiting

---

### **FASE 3: Autenticação e Autorização** 🟢 Média Prioridade
**Prazo Estimado: 3-5 dias**

#### 3.1 Sistema de Autenticação
- [ ] JWT tokens
- [ ] Refresh tokens
- [ ] Password hashing (bcrypt)
- [ ] Email verification
- [ ] Password reset

#### 3.2 Controle de Acesso
- [ ] Middleware de autorização
- [ ] Roles (student, professor, admin)
- [ ] Permissões por recurso
- [ ] Rate limiting por usuário

---

### **FASE 4: Funcionalidades Avançadas** 🔵 Média Prioridade
**Prazo Estimado: 1-2 semanas**

#### 4.1 Melhorias no Chat
- [ ] Persistência de histórico
- [ ] Busca em conversas
- [ ] Exportar conversa (PDF/TXT)
- [ ] Compartilhar conversa
- [ ] Feedback de respostas (👍/👎)
- [ ] Sugestões contextuais

#### 4.2 Analytics Avançado
- [ ] Coleta real de métricas
- [ ] Dashboards por perfil (estudante, professor, admin)
- [ ] Relatórios agendados
- [ ] Exportação funcional (CSV, Excel, PDF)
- [ ] Gráficos interativos (Chart.js/Recharts)

#### 4.3 Gestão de Documentos
- [ ] Categorização de documentos
- [ ] Tags e metadados
- [ ] Busca avançada
- [ ] Versionamento
- [ ] Compartilhamento entre usuários

---

### **FASE 5: DevOps e Deploy** ⚙️ Infraestrutura
**Prazo Estimado: 1 semana**

#### 5.1 Docker Compose Completo

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend
    networks:
      - stack-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/chatsua
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - postgres
      - redis
      - minio
      - qdrant
    networks:
      - stack-network

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=chatsua
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - stack-network

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant-data:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - stack-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - stack-network

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=admin123456
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - stack-network

volumes:
  postgres-data:
  qdrant-data:
  redis-data:
  minio-data:

networks:
  stack-network:
    driver: bridge
```

#### 5.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deploy script
```

#### 5.3 Monitoramento
- [ ] Prometheus para métricas
- [ ] Grafana para visualização
- [ ] Loki para logs
- [ ] Alertmanager para alertas

---

### **FASE 6: Testes e Qualidade** ✅ QA
**Prazo Estimado: 1 semana**

#### 6.1 Testes Frontend
- [ ] Unit tests (Vitest)
- [ ] Component tests (React Testing Library)
- [ ] E2E tests (Playwright)

#### 6.2 Testes Backend
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] API tests (Supertest)
- [ ] Load tests (k6)

#### 6.3 Qualidade de Código
- [ ] ESLint configurado
- [ ] Prettier configurado
- [ ] Husky pre-commit hooks
- [ ] Code coverage > 80%

---

### **FASE 7: Otimizações** ⚡ Performance
**Prazo Estimado: 3-5 dias**

#### 7.1 Frontend
- [ ] Code splitting
- [ ] Lazy loading de rotas
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Service Worker para cache

#### 7.2 Backend
- [ ] Query optimization
- [ ] Caching com Redis
- [ ] Database indexing
- [ ] Response compression
- [ ] Connection pooling

---

## 📅 Cronograma Sugerido

### **Sprint 1** (Semana 1-2): Fundação
- Iniciar todos os serviços (MinIO, PostgreSQL, Qdrant, Redis)
- Criar schema de banco de dados
- Estrutura básica do backend
- Endpoints essenciais (auth, documents, chat)

### **Sprint 2** (Semana 3-4): Integração
- Conectar frontend com backend
- Implementar autenticação completa
- Upload real de documentos
- Chat funcional com RAG

### **Sprint 3** (Semana 5-6): Features
- Analytics com dados reais
- Melhorias no chat
- Gestão avançada de documentos
- Sistema de notificações

### **Sprint 4** (Semana 7-8): Deploy
- Docker completo
- CI/CD pipeline
- Monitoramento
- Testes completos

### **Sprint 5** (Semana 9-10): Polish
- Otimizações de performance
- Testes de carga
- Documentação final
- Deploy em produção

---

## 🛠️ Stack Tecnológica

### **Frontend**
- React 19.2.0
- TypeScript 5.8.2
- Vite 6.2.0
- Tailwind CSS

### **Backend**
- Python 3.12+
- FastAPI 0.115+
- Uvicorn (ASGI server)
- Pydantic v2 (validação e settings)
- asyncpg (PostgreSQL async)
- redis-py (Redis)
- minio (MinIO SDK)
- google-generativeai (Gemini)
- UV (gerenciador de pacotes)

### **Banco de Dados**
- PostgreSQL 15
- Redis 7
- ~~Qdrant~~ (não necessário - usando Gemini File Search API)

### **Storage**
- MinIO

### **IA**
- Google Gemini 2.0 Flash

### **DevOps**
- Docker & Docker Compose
- GitHub Actions
- Prometheus + Grafana

---

## 📊 Métricas de Sucesso

### **Performance**
- Tempo de resposta API < 200ms (p95)
- Tempo de upload < 5s para arquivos de 10MB
- Tempo de primeira resposta do chat < 3s

### **Qualidade**
- Code coverage > 80%
- 0 bugs críticos
- Uptime > 99.5%

### **Usabilidade**
- NPS > 8/10
- Taxa de sucesso de upload > 95%
- Satisfação com respostas do chat > 85%

---

## 🚨 Riscos e Mitigações

### **Risco 1**: Limite de API do Gemini
**Mitigação**: Implementar cache de respostas frequentes, rate limiting

### **Risco 2**: Armazenamento MinIO cheio
**Mitigação**: Política de retenção, limpeza automática, alertas

### **Risco 3**: Performance com muitos documentos
**Mitigação**: Paginação, lazy loading, indexação adequada

### **Risco 4**: Custos de API
**Mitigação**: Monitoramento de uso, limites por usuário, cache

---

## 📚 Documentação a Criar

- [ ] README.md principal
- [ ] Guia de instalação
- [ ] Guia de desenvolvimento
- [ ] Documentação da API (Swagger/OpenAPI)
- [ ] Guia do usuário
- [ ] Guia de deploy
- [ ] Troubleshooting

---

## 🎯 Próximos Passos Imediatos

### ✅ Concluído (2025-11-24):
1. **Infraestrutura Base** - COMPLETO
   - [x] Criar pasta `docs/`
   - [x] Criar arquivo `PLANO.md`
   - [x] Executar `make up` (todos os serviços)
   - [x] Verificar `.env.local` com GEMINI_API_KEY
   - [x] Adicionar PostgreSQL ao docker-compose
   - [x] Adicionar Redis ao docker-compose
   - [x] Criar schema de banco de dados
   - [x] Criar estrutura de pastas do backend
   - [x] Criar documentação de portas (PORTAS.md)
   - [x] Criar bucket `chatsua-documents` no MinIO

### 🔴 Próximos Passos (Fase 1.3):
2. **Backend API** - PENDENTE
   - [ ] Inicializar projeto Node.js + TypeScript no backend/
   - [ ] Configurar dependências (express, pg, ioredis, minio, @google/genai)
   - [ ] Implementar configurações de conexão
   - [ ] Criar endpoints básicos da API
   - [ ] Adicionar backend ao docker-compose.yml

3. **Integração Frontend-Backend** - PENDENTE
   - [ ] Conectar frontend com backend
   - [ ] Testar upload e chat end-to-end
   - [ ] Implementar autenticação básica

---

## 📞 Suporte e Contato

**Projeto**: ChatSUA - Sistema Unificado de Administração UNIFESP
**Versão Atual**: 2.0.0-beta
**Última Atualização**: 2025-11-24

---

**Status**: 🟢 Em Desenvolvimento Ativo

## 📈 Progresso da Fase 1

```
Fase 1.1 - Infraestrutura Base:     [████████████████████] 100%
Fase 1.2 - PostgreSQL Schema:       [████████████████████] 100%
Fase 1.3 - API Backend:             [████░░░░░░░░░░░░░░░░]  20%

FASE 1 TOTAL:                       [████████░░░░░░░░░░░░]  40%
```

**Última Sessão**: Configuração completa da infraestrutura (PostgreSQL, Redis, MinIO)
