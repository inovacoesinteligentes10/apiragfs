# Portas Utilizadas - ChatSUA

**Projeto**: ChatSUA - Sistema Unificado de Administração UNIFESP
**Última Atualização**: 2025-11-24

---

## Serviços em Execução

### Frontend
- **Porta**: `3001`
- **URL**: http://localhost:3001
- **Serviço**: Vite Dev Server (React)
- **Status**: Running
- **Container**: N/A (executado diretamente)

### Backend API (Futuro)
- **Porta Planejada**: `8000`
- **URL Planejada**: http://localhost:8000
- **Serviço**: Express + TypeScript
- **Status**: Não implementado
- **Container**: `chatsua-backend` (futuro)

---

## Banco de Dados

### PostgreSQL
- **Porta**: `5432`
- **Host**: localhost
- **Banco**: `chatsua`
- **Usuário**: `postgres`
- **Senha**: `postgres`
- **Container**: `chatsua-postgres`
- **Status**: Healthy
- **Healthcheck**: `pg_isready -U postgres`

**String de Conexão**:
```
postgresql://postgres:postgres@localhost:5432/chatsua
```

---

## Cache e Memória

### Redis
- **Porta**: `6379`
- **Host**: localhost
- **Container**: `chatsua-redis`
- **Status**: Healthy
- **Healthcheck**: `redis-cli ping`
- **Persistência**: AOF (Append Only File)

**String de Conexão**:
```
redis://localhost:6379
```

---

## Storage

### MinIO
- **Porta API**: `9000`
- **Porta Console**: `9001`
- **URL API**: http://localhost:9000
- **URL Console**: http://localhost:9001
- **Usuário**: `admin`
- **Senha**: `admin123456`
- **Container**: `chatsua-minio`
- **Status**: Healthy
- **Healthcheck**: `http://localhost:9000/minio/health/live`

**Buckets**:
- `chatsua-documents` - Armazenamento de documentos enviados pelos usuários

**Acesso**:
```bash
# Console Web
http://localhost:9001

# Credenciais
User: admin
Password: admin123456
```

---

## Rede Docker

**Nome**: `stack-network`
**Driver**: `bridge`
**Tipo**: `external`

Todos os serviços estão conectados à rede `stack-network` para comunicação entre containers.

---

## Resumo de Portas

| Serviço      | Porta(s)    | Status  | URL/Endpoint                  |
|--------------|-------------|---------|-------------------------------|
| Frontend     | 3001        | ✓       | http://localhost:3001         |
| Backend      | 8000        | Futuro  | http://localhost:8000         |
| PostgreSQL   | 5432        | ✓       | localhost:5432                |
| Redis        | 6379        | ✓       | localhost:6379                |
| MinIO API    | 9000        | ✓       | http://localhost:9000         |
| MinIO Console| 9001        | ✓       | http://localhost:9001         |

---

## Verificação de Portas

### Checar portas em uso:
```bash
# Linux
ss -tlnp | grep -E ":(3001|8000|5432|6379|9000|9001)"

# Verificar healthcheck de todos os serviços
make health
```

### Comandos Make Disponíveis:
```bash
make help              # Lista todos os comandos
make status            # Status de todos os serviços
make health            # Verifica saúde dos serviços
make up                # Inicia todos os serviços
make down              # Para todos os serviços
make logs              # Logs de todos os serviços
make postgres-logs     # Logs específicos do PostgreSQL
make redis-logs        # Logs específicos do Redis
make minio-console     # Abre console do MinIO
```

---

## Variáveis de Ambiente

### Arquivo `.env.local`
```bash
GEMINI_API_KEY=AIzaSyB3CAdI_Hlj_PtsDjMwDcP1wWnj2j9rRF4
```

### Futuras (Backend)
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatsua
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin123456
MINIO_BUCKET=chatsua-documents
MINIO_USE_SSL=false
PORT=8000
NODE_ENV=development
```

---

## Conflitos de Portas

Caso alguma porta já esteja em uso, você pode ajustar as portas no `docker-compose.yml`:

```yaml
ports:
  - "NOVA_PORTA:PORTA_INTERNA"
```

**Exemplo**: Se a porta 5432 estiver em uso, altere para:
```yaml
ports:
  - "5433:5432"  # Acessa PostgreSQL em localhost:5433
```

---

## Notas de Segurança

- **Desenvolvimento**: As senhas atuais são para ambiente de desenvolvimento
- **Produção**: SEMPRE altere as credenciais padrão
- **MinIO**: Considere usar secrets management
- **PostgreSQL**: Use variáveis de ambiente para senhas
- **Redis**: Adicione autenticação com `requirepass`

---

**Status**: Ambiente de Desenvolvimento Configurado
**Próximo Passo**: Implementar Backend API (Fase 1.3)
