# Correção do Histórico de Chat

## Problema Identificado

O histórico de mensagens do chat estava aparecendo "fixo" porque **cada vez que o usuário iniciava o chat, uma NOVA sessão era criada**, perdendo todo o histórico anterior.

### Comportamento Anterior (Incorreto):
1. Usuário clica em "Chat"
2. Sistema **sempre** cria uma nova sessão
3. Histórico antigo é perdido
4. Usuário vê apenas as mensagens da sessão atual

## Solução Implementada

Modificado o código para **reutilizar sessões existentes** ao invés de criar novas sessões toda vez.

### Comportamento Novo (Correto):
1. Usuário clica em "Chat"
2. Sistema **verifica se já existe uma sessão** para aquele RAG store
3. Se existir: **reutiliza a sessão existente** e carrega TODO o histórico
4. Se não existir: cria nova sessão
5. Usuário vê **todo o histórico de conversas** daquele store

## Mudanças no Código

### Arquivo: `App.tsx`

#### Função `handleStartChatWithStore` (linha 662):
```typescript
// ANTES: Sempre criava nova sessão
const session = await apiService.createChatSession(store.rag_store_name);

// DEPOIS: Verifica sessões existentes primeiro
const existingSessions = await apiService.listChatSessions();
const existingSession = existingSessions.find(s => s.rag_store_name === store.rag_store_name);

let session;
if (existingSession) {
    console.log('♻️ Reutilizando sessão existente:', existingSession.id);
    session = existingSession;
} else {
    console.log('🆕 Criando nova sessão de chat...');
    session = await apiService.createChatSession(store.rag_store_name);
}
```

#### Função `handleStartChat` (linha 736):
Mesma lógica aplicada na função de fallback.

## Como Testar

### Teste 1: Reutilização de Sessão
1. Acesse o chat e envie algumas mensagens
2. Clique em "Nova Sessão" ou saia do chat
3. Volte para o chat do mesmo store
4. **Resultado esperado**: Você deve ver TODAS as mensagens anteriores

### Teste 2: Múltiplas Sessões por Store
1. Envie mensagens no store "TI"
2. Mude para o store "Financeiro"
3. Envie mensagens diferentes
4. Volte para "TI"
5. **Resultado esperado**: Cada store mantém seu próprio histórico separado

### Teste 3: Verificar no Banco de Dados
```sql
-- Ver sessões ativas com contagem de mensagens
SELECT cs.id, cs.rag_store_name, cs.message_count,
       COUNT(m.id) as actual_messages
FROM chat_sessions cs
LEFT JOIN messages m ON m.session_id = cs.id
WHERE cs.ended_at IS NULL
GROUP BY cs.id
ORDER BY cs.started_at DESC;

-- Ver histórico de uma sessão específica
SELECT role, LEFT(content, 60) as content_preview, created_at
FROM messages
WHERE session_id = 'SEU_SESSION_ID'
ORDER BY created_at;
```

## Logs de Depuração

Ao iniciar o chat, você verá no console do navegador:

- `♻️ Reutilizando sessão existente: <session_id>` - Quando encontra sessão existente
- `🆕 Criando nova sessão de chat...` - Quando cria nova sessão
- `📜 Histórico carregado: X mensagens` - Quantidade de mensagens carregadas

## Benefícios

✅ Histórico completo preservado entre sessões
✅ Conversas continuam de onde pararam
✅ Cada store mantém seu próprio histórico
✅ Melhor experiência do usuário
✅ Conformidade com sistemas de chat tradicionais

## Deploy

As mudanças já foram aplicadas:
- ✅ Código atualizado em `App.tsx`
- ✅ Frontend buildado (`npm run build`)
- ✅ Container frontend reiniciado
- ✅ Sistema pronto para uso

## Documentos Processados Atualmente

Os seguintes documentos estão disponíveis com RAG stores válidos:

1. **L14133.pdf**
   - Store: `compras`
   - RAG Store: `fileSearchStores/compras-bfff76fde8ac4792aaf-ushy0m227bfy`

2. **PRÉ_PROJETO_DE_DOUTORADO_FRANCISMAR.pdf**
   - Store: `suaunifesp`
   - RAG Store: `fileSearchStores/suaunifesp-bfff76fde8ac4792-nsbpglxc6r00`

---

**Data da Correção**: 2025-11-27
**Status**: ✅ Implementado e Testado
