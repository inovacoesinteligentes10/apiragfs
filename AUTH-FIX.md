# Correção de Autenticação nas Rotas de Chat

## Problema Identificado

O histórico de chat estava "fixo" mostrando apenas mensagens antigas porque:

1. **Todas as rotas de chat usavam `user_id = "default-user"`** ao invés do usuário autenticado
2. **Sessões e mensagens eram criadas com o usuário errado**
3. **Quando você estava logado como usuário real (UUID), não via suas próprias mensagens**
4. **Apenas via mensagens antigas criadas com "default-user"**

## Exemplo do Problema

### Antes (Incorreto):
```python
@router.post("/sessions")
async def create_chat_session(
    session_data: ChatSessionCreate,
    user_id: str = "default-user"  # ❌ SEMPRE usava "default-user"
):
    # Criava sessão com user_id = "default-user"
```

### Depois (Correto):
```python
@router.post("/sessions")
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: dict = Depends(get_current_user)  # ✅ Pega do JWT
):
    user_id = current_user['id']  # ✅ Usa UUID real do usuário
    # Criava sessão com o user_id correto
```

## Rotas Corrigidas

Todas as rotas de chat agora usam autenticação JWT:

1. ✅ **POST /api/v1/chat/sessions** - Criar sessão
2. ✅ **GET /api/v1/chat/sessions** - Listar sessões
3. ✅ **GET /api/v1/chat/sessions/{session_id}** - Buscar sessão
4. ✅ **GET /api/v1/chat/sessions/{session_id}/messages** - Buscar mensagens
5. ✅ **POST /api/v1/chat/sessions/{session_id}/query** - Enviar query
6. ✅ **POST /api/v1/chat/sessions/{session_id}/query-stream** - Query com streaming
7. ✅ **POST /api/v1/chat/cleanup-orphaned** - Limpar sessões órfãs
8. ✅ **DELETE /api/v1/chat/sessions/{session_id}** - Deletar sessão
9. ✅ **GET /api/v1/chat/sessions/{session_id}/insights** - Buscar insights

## Mudanças Aplicadas

### Arquivo: `backend/app/api/v1/chat.py`

1. **Importado o middleware de autenticação:**
```python
from ...middleware.auth import get_current_user
```

2. **Substituído em TODAS as rotas:**
```python
# ANTES:
user_id: str = "default-user"  # TODO: Pegar do token JWT

# DEPOIS:
current_user: dict = Depends(get_current_user)
```

3. **Adicionado extração do user_id em cada função:**
```python
user_id = current_user['id']
```

## Limpeza Realizada

Como as sessões antigas foram criadas com `user_id = "default-user"`, foi necessário:

1. ✅ **Marcou 13 sessões antigas** como finalizadas (ended_at = NOW())
2. ✅ **Reprocessou 2 documentos** para criar novos RAG stores válidos
3. ✅ **Limpou cache Redis** de sessões antigas

## Como Testar

### 1. Criar nova sessão de chat:
```bash
# Fazer login primeiro
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "seu_usuario", "password": "sua_senha"}'

# Vai retornar um token JWT - use-o nas próximas chamadas
export TOKEN="seu_token_aqui"

# Criar sessão de chat
curl -X POST "http://localhost:8000/api/v1/chat/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rag_store_name": "fileSearchStores/compras-..."}'
```

### 2. Verificar no banco que a sessão foi criada com o UUID correto:
```sql
SELECT id, user_id, rag_store_name, started_at
FROM chat_sessions
WHERE ended_at IS NULL
ORDER BY started_at DESC
LIMIT 5;
```

**Resultado esperado:**
- `user_id` deve ser um UUID (ex: `bfff76fd-e8ac-4792-aafa-1024862bf40f`)
- NÃO deve ser "default-user"

### 3. Testar no frontend:
1. Faça login na aplicação
2. Acesse a aba "Chat"
3. Envie algumas mensagens
4. Saia e volte para o chat
5. **Resultado esperado**: Você deve ver TODO o histórico das suas mensagens

## Verificação de Segurança

Agora **TODAS as rotas de chat exigem autenticação JWT**:

```bash
# Sem token - deve retornar 401 Unauthorized
curl -X GET "http://localhost:8000/api/v1/chat/sessions"
# {"detail": "Could not validate credentials"}

# Com token válido - deve funcionar
curl -X GET "http://localhost:8000/api/v1/chat/sessions" \
  -H "Authorization: Bearer $TOKEN"
# [{"id": "...", "user_id": "uuid-real", ...}]
```

## Benefícios

✅ **Segurança**: Cada usuário só vê suas próprias sessões e mensagens
✅ **Isolamento**: Mensagens de um usuário não vazam para outros
✅ **Histórico correto**: Cada usuário tem seu próprio histórico persistente
✅ **Auditoria**: Possível rastrear qual usuário criou cada sessão/mensagem
✅ **Multi-tenant**: Sistema preparado para múltiplos usuários simultâneos

## Status

- ✅ Código corrigido em todas as rotas de chat
- ✅ Backend reiniciado com as mudanças
- ✅ Sessões antigas limpas
- ✅ Documentos reprocessados
- ✅ Sistema pronto para uso com autenticação completa

---

**Data da Correção**: 2025-11-27
**Arquivos Modificados**: `backend/app/api/v1/chat.py`
**Status**: ✅ Implementado e Pronto para Produção
