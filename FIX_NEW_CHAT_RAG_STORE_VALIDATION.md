# ✅ FIX: Validação de RAG Store ao Criar Nova Conversa

## 🐛 Problema Completo Identificado

Quando o usuário clicava em **"New Chat"**, ocorriam dois problemas:

### Problema 1: Reutilizava a mesma sessão
- ❌ O código deletava a sessão antiga mas imediatamente buscava sessões existentes
- ❌ Encontrava a sessão que acabou de deletar (race condition)
- ❌ Reutilizava ela ao invés de criar uma nova

### Problema 2: RAG Store inválido (ERRO ATUAL)
- ❌ O `rag_store_name` no banco apontava para um RAG store que **não existe mais no Gemini**
- ❌ Quando tentava criar nova sessão, validação falhava com erro:
  ```
  O RAG store 'fileSearchStores/compras-bfff76fde8ac4792aaf-g4xfkdvtei6y' não existe ou está inacessível
  ```
- ❌ Isso acontece porque:
  1. Documentos foram deletados do Gemini
  2. Mas `documents.rag_store_name` no banco ainda tinha referência antiga
  3. Query SQL pegava o `MAX(rag_store_name)` que era inválido

## ✅ Solução Implementada

### Correção 1: Forçar criação de nova sessão (Frontend)

**Arquivo:** `App.tsx`

Adicionado parâmetro `forceNewSession` para garantir que "New Chat" sempre cria uma nova sessão:

```typescript
// Linha 765
const handleStartChatWithStore = async (store: RagStore, forceNewSession: boolean = false) => {
    if (forceNewSession) {
        // Criar SEMPRE uma nova sessão (usado em "New Chat")
        session = await apiService.createChatSession(store.rag_store_name);
    } else {
        // Reutilizar sessão existente se houver (comportamento padrão)
        // ...
    }
}

// Linha 999
await handleStartChatWithStore(storeToUse, true); // Force new session
```

### Correção 2: Validação automática de RAG Stores (Backend)

**Arquivo:** `backend/app/api/v1/stores.py`

Adicionado validação automática ao listar stores:

```python
# Importar GeminiService
from ...services.gemini_service import GeminiService

# No endpoint list_stores (linhas 89-121)
gemini_service = GeminiService()

for store in stores:
    # Validar se o rag_store_name realmente existe no Gemini
    if store_dict.get('rag_store_name'):
        is_valid = await gemini_service.validate_rag_store(store_dict['rag_store_name'])
        if not is_valid:
            # Limpar o rag_store_name inválido dos documentos
            await db.execute(
                """
                UPDATE documents
                SET rag_store_name = NULL
                WHERE department = $1 AND rag_store_name = $2
                """,
                store_dict['name'], store_dict['rag_store_name']
            )
            # Remover rag_store_name do resultado
            store_dict['rag_store_name'] = None
```

## 🎯 Como Funciona Agora

### Fluxo Completo do "New Chat":

1. **Frontend** - Usuário clica em "New Chat"
2. **Frontend** - Deleta sessão atual do backend
3. **Frontend** - Limpa histórico local
4. **Frontend** - Aguarda 500ms
5. **Frontend** - Busca lista de stores
6. **Backend** - Lista stores e **valida cada rag_store_name**
   - Se inválido: limpa no banco e retorna `null`
7. **Frontend** - Recebe stores com `rag_store_name` válidos ou `null`
8. **Frontend** - Cria NOVA sessão com `forceNewSession: true`
9. **Backend** - Valida se `rag_store_name` existe antes de criar sessão
10. ✅ Se válido: cria sessão
11. ❌ Se inválido: retorna erro 400

### Proteções Implementadas:

1. ✅ **Validação preventiva**: Lista de stores limpa `rag_store_name` inválidos automaticamente
2. ✅ **Validação na criação**: Backend valida `rag_store_name` antes de criar sessão
3. ✅ **Forçar nova sessão**: Frontend passa flag para garantir nova sessão vazia
4. ✅ **Limpeza automática**: RAG stores deletados são removidos do banco automaticamente

## 📊 Antes vs Depois

| Situação | Antes | Depois |
|----------|-------|--------|
| RAG store deletado do Gemini | ❌ Erro ao criar sessão | ✅ Limpa automaticamente |
| Clica "New Chat" | ❌ Reutiliza sessão antiga | ✅ Cria nova sessão vazia |
| Store com `rag_store_name` inválido | ❌ Aparece como disponível | ✅ Aparece como sem documentos |
| Documentos reprocessados | ❌ Usa RAG store antigo | ✅ Usa novo `rag_store_name` |

## 🧪 Como Testar

1. Acesse http://localhost:3001
2. Faça login (admin/admin123)
3. **Teste 1**: Faça upload de um documento
   - ✅ Store deve mostrar `rag_store_name` válido
4. **Teste 2**: Inicie uma conversa
   - ✅ Deve funcionar normalmente
5. **Teste 3**: Clique em "New Chat"
   - ✅ Deve criar nova conversa vazia
   - ✅ Conversa antiga aparece na sidebar
6. **Teste 4**: Delete todos os documentos de um store manualmente do Gemini
   - ✅ Na próxima listagem, `rag_store_name` será limpo automaticamente
   - ✅ Store aparece com 0 documentos

## 📁 Arquivos Modificados

### Frontend:
- `App.tsx` (linhas 765-861, 950-1009)
  - Adicionado parâmetro `forceNewSession`
  - Modificado `handleNewChat()` para passar `forceNewSession: true`

### Backend:
- `backend/app/api/v1/stores.py` (linhas 27, 89-121)
  - Importado `GeminiService`
  - Adicionada validação automática de `rag_store_name` ao listar stores
  - Limpeza automática de RAG stores inválidos

## 🔧 Manutenção

Se você deletar documentos manualmente do Gemini:

1. O sistema **detecta automaticamente** na próxima chamada de `/api/v1/stores`
2. **Limpa** o `rag_store_name` inválido da tabela `documents`
3. **Retorna** stores com `rag_store_name: null` se não houver RAG store válido

## 📝 Logs de Debug

Ao listar stores com RAG store inválido:

```
⚠️ RAG store inválido detectado: fileSearchStores/compras-bfff76fde8ac4792aaf-g4xfkdvtei6y (store: compras)
🔧 Limpando rag_store_name inválido...
✅ rag_store_name inválido removido para store: compras
```

---

**Status**: ✅ Implementado e Testado
**Data**: 2025-11-27
**Impacto**: Crítico - Resolve erro bloqueante no "New Chat"
**Relacionado**: FIX_NEW_CHAT_BUTTON.md
