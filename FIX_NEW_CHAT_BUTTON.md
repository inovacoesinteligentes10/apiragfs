# ✅ FIX: Botão "New Chat" Agora Cria Nova Conversa

## 🐛 Problema Identificado

Quando o usuário clicava em **"New Chat"**, o sistema estava:
- ❌ Reutilizando a sessão anterior ao invés de criar uma nova
- ❌ Carregando o histórico antigo na "nova" conversa
- ❌ Não limpando a tela corretamente

### Causa Raiz

No arquivo `App.tsx`, a função `handleStartChatWithStore()` sempre verificava se já existia uma sessão para o RAG store e **reutilizava ela**:

```typescript
// ANTES (linha 813-819)
const existingSession = existingSessions.find(s => s.rag_store_name === store.rag_store_name);

if (existingSession) {
    console.log('♻️ Reutilizando sessão existente:', existingSession.id);
    session = existingSession;  // ❌ PROBLEMA: Sempre reutilizava!
}
```

Mesmo quando `handleNewChat()` deletava a sessão antiga, o timing fazia com que a sessão ainda fosse encontrada e reutilizada.

## ✅ Solução Implementada

### 1. Adicionado parâmetro `forceNewSession`

Modificamos `handleStartChatWithStore()` para aceitar um parâmetro opcional que **força a criação de uma nova sessão**:

```typescript
// DEPOIS
const handleStartChatWithStore = async (store: RagStore, forceNewSession: boolean = false) => {
    if (forceNewSession) {
        // Criar SEMPRE uma nova sessão (usado em "New Chat")
        session = await apiService.createChatSession(store.rag_store_name);
    } else {
        // Reutilizar sessão existente se houver (comportamento padrão)
        const existingSession = existingSessions.find(s => s.rag_store_name === store.rag_store_name);

        if (existingSession) {
            session = existingSession;
        } else {
            session = await apiService.createChatSession(store.rag_store_name);
        }
    }
}
```

### 2. Modificado `handleNewChat()`

Agora `handleNewChat()` passa `true` para forçar criação de nova sessão:

```typescript
// Linha 999 - Passar flag para forçar criação de nova sessão
await handleStartChatWithStore(storeToUse, true);
```

### 3. Melhorado timing

Adicionamos um delay maior (500ms) para garantir que o backend processe a deleção antes de criar a nova sessão:

```typescript
// Aguardar um pouco para o estado ser atualizado E para o backend processar a deleção
await new Promise(resolve => setTimeout(resolve, 500));
```

## 🎯 Comportamento Agora

### Quando clica em "New Chat":

1. ✅ **Encerra chat atual** - Deleta a sessão no backend
2. ✅ **Limpa a tela** - Remove todo o histórico local
3. ✅ **Aguarda processamento** - 500ms para o backend processar
4. ✅ **Cria NOVA sessão** - Força criação, ignorando sessões existentes
5. ✅ **Tela limpa** - Nova conversa começa vazia
6. ✅ **Histórico salvo** - Conversa antiga continua na sidebar

### Quando navega para Chat normalmente:

1. ✅ **Reutiliza sessão existente** - Se já existe uma sessão para o store
2. ✅ **Carrega histórico** - Continua de onde parou
3. ✅ **Cria nova apenas se necessário** - Se não existe sessão para o store

## 📁 Arquivos Modificados

- `App.tsx` (linhas 765-861, 950-1009)
  - Função `handleStartChatWithStore()` - Adicionado parâmetro `forceNewSession`
  - Função `handleNewChat()` - Passa `forceNewSession: true`

## 🧪 Como Testar

Execute o script de teste:

```bash
./test_new_chat.sh
```

### Teste Manual

1. Faça login no sistema
2. Inicie uma conversa e envie algumas mensagens
3. Clique no botão **"New Chat"**
4. ✅ **ESPERADO**: Tela limpa, nova conversa vazia
5. ❌ **ANTES**: Mesma conversa carregada novamente
6. Verifique a sidebar - a conversa antiga deve aparecer lá
7. Clique na conversa antiga - ela deve ser retomada com todo o histórico

## 🔍 Logs de Debug

Ao clicar em "New Chat", você verá nos logs do console:

```
🆕 DEBUG: handleNewChat - Início
🔚 Encerrando chat atual: <session-id>
✅ Sessão deletada com sucesso
🔍 DEBUG: handleStartChatWithStore - Início
🆕 Forçar nova sessão: true
🆕 Criando NOVA sessão (forçado)...
✅ Nova sessão criada com sucesso!
```

## 📊 Resumo

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Cria nova sessão | ❌ Não | ✅ Sim |
| Limpa tela | ❌ Não | ✅ Sim |
| Salva histórico | ✅ Sim | ✅ Sim |
| Conversa vazia | ❌ Não | ✅ Sim |
| Retomar funcionando | ✅ Sim | ✅ Sim |

---

**Status**: ✅ Implementado e Testado
**Data**: 2025-11-27
**Impacto**: Alto - Melhora significativa na UX do chat
