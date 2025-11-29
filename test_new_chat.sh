#!/bin/bash

# Script para testar o comportamento do botão "New Chat"

BASE_URL="http://localhost:8000/api/v1"

echo "═══════════════════════════════════════════════════════"
echo "🧪 TESTE: Botão 'New Chat' - Criar Nova Conversa"
echo "═══════════════════════════════════════════════════════"
echo ""

# 1. Login
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Erro no login!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login bem-sucedido! Token: ${TOKEN:0:20}..."
echo ""

# 2. Listar RAG stores
echo "2️⃣ Listando RAG stores disponíveis..."
STORES=$(curl -s -X GET "$BASE_URL/stores" \
  -H "Authorization: Bearer $TOKEN")

echo "📦 RAG Stores encontrados:"
echo "$STORES" | jq -r '.[] | "  - \(.display_name) (\(.document_count) documentos, rag_store: \(.rag_store_name // "não criado"))"'

RAG_STORE_NAME=$(echo "$STORES" | jq -r '[.[] | select(.document_count > 0 and .rag_store_name != null)][0].rag_store_name')

if [ "$RAG_STORE_NAME" = "null" ] || [ -z "$RAG_STORE_NAME" ]; then
    echo "❌ Nenhum RAG store com documentos encontrado!"
    echo "⚠️  Faça upload de documentos primeiro"
    exit 1
fi

echo "✅ RAG Store selecionado: $RAG_STORE_NAME"
echo ""

# 3. Criar primeira sessão
echo "3️⃣ Criando primeira sessão de chat..."
SESSION1=$(curl -s -X POST "$BASE_URL/chat/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"rag_store_name\": \"$RAG_STORE_NAME\"}")

SESSION1_ID=$(echo $SESSION1 | jq -r '.id')
echo "✅ Primeira sessão criada: $SESSION1_ID"
echo ""

# 4. Enviar mensagem na primeira sessão
echo "4️⃣ Enviando mensagem na primeira sessão..."
curl -s -X POST "$BASE_URL/chat/sessions/$SESSION1_ID/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Olá! Esta é a primeira conversa."}' > /dev/null

echo "✅ Mensagem enviada: 'Olá! Esta é a primeira conversa.'"
echo ""

# 5. Verificar mensagens da primeira sessão
echo "5️⃣ Verificando mensagens da primeira sessão..."
MESSAGES1=$(curl -s -X GET "$BASE_URL/chat/sessions/$SESSION1_ID/messages" \
  -H "Authorization: Bearer $TOKEN")

MSG_COUNT1=$(echo $MESSAGES1 | jq 'length')
echo "📧 Primeira sessão tem $MSG_COUNT1 mensagens"
echo ""

# 6. Listar todas as sessões (deve ter 1)
echo "6️⃣ Listando todas as sessões..."
SESSIONS_BEFORE=$(curl -s -X GET "$BASE_URL/chat/sessions" \
  -H "Authorization: Bearer $TOKEN")

SESSION_COUNT_BEFORE=$(echo $SESSIONS_BEFORE | jq 'length')
echo "📊 Total de sessões ANTES de criar nova: $SESSION_COUNT_BEFORE"
echo "Sessões:"
echo "$SESSIONS_BEFORE" | jq -r '.[] | "  - ID: \(.id) | RAG Store: \(.rag_store_name) | Mensagens: \(.message_count)"'
echo ""

# 7. SIMULAR "NEW CHAT": Deletar sessão antiga e criar nova
echo "7️⃣ SIMULANDO 'NEW CHAT': Deletando sessão antiga..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/chat/sessions/$SESSION1_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Sessão $SESSION1_ID deletada"
echo ""

# 8. Aguardar um pouco para o backend processar
echo "8️⃣ Aguardando processamento..."
sleep 1
echo ""

# 9. Criar NOVA sessão (deve criar uma nova, não reutilizar a antiga)
echo "9️⃣ Criando NOVA sessão de chat..."
SESSION2=$(curl -s -X POST "$BASE_URL/chat/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"rag_store_name\": \"$RAG_STORE_NAME\"}")

SESSION2_ID=$(echo $SESSION2 | jq -r '.id')
echo "✅ Nova sessão criada: $SESSION2_ID"
echo ""

# 10. Verificar que a nova sessão está vazia
echo "🔟 Verificando mensagens da NOVA sessão..."
MESSAGES2=$(curl -s -X GET "$BASE_URL/chat/sessions/$SESSION2_ID/messages" \
  -H "Authorization: Bearer $TOKEN")

MSG_COUNT2=$(echo $MESSAGES2 | jq 'length')
echo "📧 Nova sessão tem $MSG_COUNT2 mensagens"
echo ""

# 11. Listar todas as sessões novamente
echo "1️⃣1️⃣ Listando todas as sessões após 'New Chat'..."
SESSIONS_AFTER=$(curl -s -X GET "$BASE_URL/chat/sessions" \
  -H "Authorization: Bearer $TOKEN")

SESSION_COUNT_AFTER=$(echo $SESSIONS_AFTER | jq 'length')
echo "📊 Total de sessões DEPOIS de criar nova: $SESSION_COUNT_AFTER"
echo "Sessões:"
echo "$SESSIONS_AFTER" | jq -r '.[] | "  - ID: \(.id) | RAG Store: \(.rag_store_name) | Mensagens: \(.message_count)"'
echo ""

# 12. VALIDAÇÃO FINAL
echo "═══════════════════════════════════════════════════════"
echo "📋 RESULTADO DO TESTE"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ "$SESSION1_ID" != "$SESSION2_ID" ]; then
    echo "✅ PASSOU: Nova sessão tem ID diferente da antiga"
    echo "   Sessão 1: $SESSION1_ID"
    echo "   Sessão 2: $SESSION2_ID"
else
    echo "❌ FALHOU: Nova sessão tem o MESMO ID da antiga!"
    echo "   ID: $SESSION1_ID"
fi

if [ "$MSG_COUNT2" -eq 0 ]; then
    echo "✅ PASSOU: Nova sessão está vazia (0 mensagens)"
else
    echo "❌ FALHOU: Nova sessão NÃO está vazia ($MSG_COUNT2 mensagens)"
fi

if [ "$SESSION_COUNT_AFTER" -eq 1 ]; then
    echo "✅ PASSOU: Apenas 1 sessão ativa (a nova)"
else
    echo "⚠️  AVISO: Existem $SESSION_COUNT_AFTER sessões ativas"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Teste concluído!"
echo "═══════════════════════════════════════════════════════"
