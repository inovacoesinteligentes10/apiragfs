#!/bin/bash
# Script de teste para verificar o tratamento de erro quando documentos são removidos

echo "🧪 Teste: Erro de Chat quando documentos são removidos"
echo "========================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000"

echo "1️⃣ Testando endpoint de chat com session ID inválido..."
echo ""

# Simular envio de mensagem para sessão inexistente
SESSION_ID="invalid-session-id-12345"
MESSAGE="Test message"

echo "📤 Enviando POST para: ${BASE_URL}/api/v1/chat/sessions/${SESSION_ID}/query-stream"
echo "📝 Mensagem: ${MESSAGE}"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BASE_URL}/api/v1/chat/sessions/${SESSION_ID}/query-stream" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"${MESSAGE}\"}" 2>&1)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📊 Resultado:"
echo "HTTP Status: ${HTTP_STATUS}"
echo "Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

# Verificar se o status é 404 ou 500 (erro esperado)
if [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "500" ]; then
    echo -e "${GREEN}✅ Status de erro recebido corretamente (${HTTP_STATUS})${NC}"

    # Verificar se o corpo contém mensagem de erro
    if echo "$BODY" | grep -q "detail"; then
        echo -e "${GREEN}✅ Mensagem de erro presente no corpo da resposta${NC}"

        # Extrair mensagem de erro
        ERROR_MSG=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('detail', 'N/A'))" 2>/dev/null || echo "N/A")
        echo -e "${YELLOW}📋 Mensagem de erro: ${ERROR_MSG}${NC}"
    else
        echo -e "${RED}❌ Mensagem de erro não encontrada${NC}"
    fi
else
    echo -e "${RED}❌ Status inesperado: ${HTTP_STATUS} (esperado: 404 ou 500)${NC}"
fi

echo ""
echo "2️⃣ Verificando logs do frontend..."
echo ""
echo "🔍 Verifique no console do navegador se:"
echo "   - onError callback foi invocado"
echo "   - Toast warning foi exibido"
echo "   - Mensagem: 'Conversa não disponível: os documentos foram removidos...'"
echo "   - Redirect para dashboard ocorreu"
echo ""

echo "3️⃣ Checklist de validação:"
echo ""
echo "Frontend (Browser Console):"
echo "  [ ] ❌ Erro no streaming detectado"
echo "  [ ] 📡 onError callback invocado"
echo "  [ ] ⚠️  Toast warning exibido (6s)"
echo "  [ ] 🏠 Redirect para dashboard"
echo "  [ ] 🧹 Sessão limpa (chatHistory vazio)"
echo ""
echo "Backend (Resposta API):"
echo "  [ ] 🔴 HTTP Status 404 ou 500"
echo "  [ ] 📝 Mensagem de erro no body"
echo "  [ ] 🔒 Sem stack trace exposto"
echo ""

echo "✅ Teste concluído!"
echo ""
echo "💡 Para teste completo:"
echo "   1. Abra o navegador em http://localhost:3001"
echo "   2. Faça login e inicie um chat"
echo "   3. Delete o RAG store no backend"
echo "   4. Tente enviar uma mensagem"
echo "   5. Verifique se o toast warning aparece"
echo ""
