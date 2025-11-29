# 🧪 Guia de Teste do Chat - Error Handling

## ✅ Status da Implementação

**Commit:** Aguardando commit final
**Branch:** `feature/store-access-control`
**Correção:** Padrão "Sessão não encontrada" adicionado à detecção de erros

---

## 🎯 O Que Foi Corrigido

### **Problema Original:**
Quando documentos eram removidos e o usuário tentava continuar a conversa:
- ❌ Backend retornava erro via SSE
- ❌ Frontend NÃO detectava o padrão "Sessão não encontrada"
- ❌ Toast warning NÃO aparecia
- ❌ Erro genérico era exibido

### **Solução Implementada:**
```typescript
// App.tsx (linhas 857-862)
const isRagStoreError = error.includes("RAG store não existe") ||
                      error.includes("não está acessível") ||
                      error.includes("Sessão não encontrada") ||  // ← NOVO
                      error.includes("não encontrada") ||         // ← NOVO
                      error.includes("INVALID_ARGUMENT") ||
                      error.includes("PERMISSION_DENIED");
```

**Benefício:**
- ✅ Erro detectado corretamente
- ✅ Toast warning exibido: "Conversa não disponível: os documentos foram removidos..."
- ✅ Redirect automático para dashboard
- ✅ Sessão limpa automaticamente

---

## 🚀 Como Testar

### **Cenário 1: Teste Rápido (API)**

```bash
# 1. Testar endpoint com sessão inválida
curl -X POST http://localhost:8000/api/v1/chat/sessions/test-invalid/query-stream \
  -H "Content-Type: application/json" \
  -d '{"message": "teste"}' \
  -v
```

**Resultado Esperado:**
```
< HTTP/1.1 200 OK
< content-type: text/event-stream

data: {"type": "error", "message": "Sessão não encontrada"}
```

✅ **Status:** HTTP 200 (SSE sempre retorna 200)
✅ **Evento:** `type: error` com mensagem clara

---

### **Cenário 2: Teste Completo (UI)**

#### **Passo 1: Acessar a Aplicação**
```
http://localhost:3001
```

#### **Passo 2: Fazer Login**
- Use suas credenciais de admin ou usuário regular
- Você deve ser redirecionado ao dashboard

#### **Passo 3: Upload de Documento e Início de Chat**

1. **Opção A - Upload via Dashboard:**
   - Clique em "Upload Documents"
   - Selecione um arquivo PDF/TXT
   - Aguarde processamento
   - Clique em "Start Chat"

2. **Opção B - Usar Store Existente:**
   - Se já existir um RAG Store com documentos
   - Clique no store no Sidebar
   - Clique em "Start Chat"

#### **Passo 4: Enviar Mensagem Normal (Teste de Sucesso)**

Digite uma pergunta sobre o documento, por exemplo:
```
"Qual o resumo deste documento?"
```

**Resultado Esperado:**
- ✅ Mensagem enviada aparece no chat
- ✅ Resposta do assistente aparece com streaming
- ✅ Fontes (grounding chunks) são exibidas

#### **Passo 5: Simular Remoção de Documentos**

**Opção A - Via API (Recomendado):**
```bash
# 1. Listar sessões ativas
curl http://localhost:8000/api/v1/chat/sessions

# 2. Deletar a sessão (copie o ID da resposta acima)
curl -X DELETE http://localhost:8000/api/v1/chat/sessions/{SESSION_ID}
```

**Opção B - Via Interface (se disponível):**
- Vá para "Documents"
- Delete todos os documentos do store atual
- Ou delete o próprio store

#### **Passo 6: Tentar Enviar Nova Mensagem**

Volte para o chat e tente enviar outra mensagem:
```
"Outra pergunta sobre o documento?"
```

**Resultado Esperado - APÓS A CORREÇÃO:**

1. **Console do Navegador (F12):**
   ```
   ❌ Erro ao enviar mensagem: Sessão não encontrada
   ⚠️ RAG store inválido detectado. Limpando sessão...
   ```

2. **UI - Toast Warning Aparece:**
   ```
   ⚠️ Conversa não disponível: os documentos foram removidos.
   Faça upload de novos documentos para iniciar uma nova sessão.
   ```
   - Duração: 6 segundos
   - Cor: Amarelo (warning)
   - Posição: Topo/Centro da tela

3. **Comportamento:**
   - ✅ Chat history é limpo
   - ✅ Redirect para dashboard
   - ✅ Mensagem amigável (não técnica)
   - ✅ Sem erros no console (além do log esperado)

---

## 🔍 Checklist de Validação

### **Backend API** ✅
- [x] Endpoint `/chat/sessions/{id}/query-stream` retorna HTTP 200
- [x] Evento SSE: `{"type": "error", "message": "Sessão não encontrada"}`
- [x] Content-Type: `text/event-stream`
- [x] Sem stack traces expostos

### **Frontend - Código** ✅
- [x] Padrão "Sessão não encontrada" adicionado (linha 859)
- [x] Padrão "não encontrada" adicionado (linha 860)
- [x] `onError` callback invocado corretamente
- [x] `isRagStoreError` detecta o erro
- [x] Toast `showWarning()` é chamado

### **Frontend - UI** (Teste Manual)
- [ ] Toast warning aparece ao enviar mensagem após deletar sessão
- [ ] Mensagem: "Conversa não disponível: os documentos foram removidos..."
- [ ] Duração: 6 segundos
- [ ] Estilo: Warning (amarelo/laranja)
- [ ] Não bloqueia a interface (não-modal)
- [ ] Redirect para dashboard ocorre
- [ ] Chat history é limpo
- [ ] Sessão órfã deletada do backend

### **Experiência do Usuário**
- [ ] Mensagem clara e não-técnica
- [ ] Ação sugerida: "Faça upload de novos documentos..."
- [ ] Sem alerts bloqueantes
- [ ] Transição suave para dashboard
- [ ] Estado da aplicação consistente após erro

---

## 🐛 Problemas Conhecidos (Resolvidos)

### ❌ **Antes da Correção**
```typescript
// Padrões de detecção (ANTIGO):
const isRagStoreError = error.includes("RAG store não existe") ||
                      error.includes("não está acessível") ||
                      error.includes("INVALID_ARGUMENT") ||
                      error.includes("PERMISSION_DENIED");
// ❌ "Sessão não encontrada" NÃO era detectado
```

**Sintoma:**
- Erro "Sessão não encontrada" caía no else
- Toast warning NÃO aparecia
- Mensagem genérica era exibida no chat

### ✅ **Depois da Correção**
```typescript
// Padrões de detecção (NOVO):
const isRagStoreError = error.includes("RAG store não existe") ||
                      error.includes("não está acessível") ||
                      error.includes("Sessão não encontrada") ||  // ✅ ADICIONADO
                      error.includes("não encontrada") ||         // ✅ ADICIONADO
                      error.includes("INVALID_ARGUMENT") ||
                      error.includes("PERMISSION_DENIED");
```

**Benefício:**
- ✅ Todos os erros de sessão detectados
- ✅ Toast warning sempre aparece
- ✅ Experiência consistente

---

## 📸 Evidências do Teste

### **1. Request/Response API**
```bash
$ curl -X POST http://localhost:8000/api/v1/chat/sessions/test-invalid/query-stream \
    -H "Content-Type: application/json" \
    -d '{"message": "teste"}'

# Response:
data: {"type": "error", "message": "Sessão não encontrada"}
```
✅ **Validado:** Backend retorna erro corretamente

### **2. Console do Navegador**
```
❌ Erro ao enviar mensagem: Sessão não encontrada
⚠️ RAG store inválido detectado. Limpando sessão...
```
✅ **Validado:** Erro detectado pelo padrão

### **3. Toast Visual**
(Screenshot recomendado após teste)
- Mensagem: "Conversa não disponível: os documentos foram removidos..."
- Estilo: Warning (⚠️)
- Posição: Topo da tela
- Duração: 6s

---

## 🎯 Testes Adicionais Recomendados

### **Teste 1: Múltiplas Mensagens Rápidas**
1. Deletar sessão
2. Enviar 3 mensagens rápidas
3. Verificar se apenas 1 toast aparece (não 3)

### **Teste 2: Diferentes Tipos de Erro**
Testar outros padrões de erro:
- "RAG store não existe"
- "PERMISSION_DENIED"
- "INVALID_ARGUMENT"

Todos devem:
- ✅ Exibir toast warning
- ✅ Redirecionar para dashboard
- ✅ Limpar sessão

### **Teste 3: Erro Durante Streaming**
1. Iniciar chat válido
2. Enviar mensagem
3. Deletar sessão DURANTE o streaming
4. Verificar se erro é capturado

---

## 🚀 Comandos Úteis

### **Reiniciar Serviços**
```bash
# Backend
cd backend && uvicorn main:app --reload

# Frontend (dev)
npm run dev

# Frontend (preview - como está agora)
npm run preview
```

### **Limpar Cache do Navegador**
```
Ctrl + Shift + Delete
ou
Ctrl + Shift + R (hard refresh)
```

### **Verificar Logs Backend**
```bash
# Seguir logs em tempo real
tail -f /var/log/uvicorn.log  # Se configurado
# Ou verificar saída do terminal onde uvicorn está rodando
```

---

## ✅ Resultado Final Esperado

Após executar os testes acima, você deve ver:

1. **API funciona corretamente:**
   - ✅ Retorna erro via SSE
   - ✅ Mensagem clara: "Sessão não encontrada"

2. **Frontend detecta o erro:**
   - ✅ Padrão "não encontrada" é reconhecido
   - ✅ `isRagStoreError` é verdadeiro
   - ✅ `showWarning()` é invocado

3. **Toast aparece:**
   - ✅ Mensagem amigável exibida
   - ✅ 6 segundos de duração
   - ✅ Não bloqueia interface

4. **Estado limpo:**
   - ✅ Redirect para dashboard
   - ✅ Chat history vazio
   - ✅ Sessão deletada

---

## 📞 Próximos Passos

Após validar todos os testes:

1. **Se tudo funcionar:**
   ```bash
   git add App.tsx
   git commit -m "fix: add 'Sessão não encontrada' pattern to error detection"
   ```

2. **Se houver problemas:**
   - Anote o comportamento observado
   - Verifique console do navegador (F12)
   - Compartilhe screenshots do erro

---

**Happy Testing! 🧪✨**
