#!/bin/bash

echo "🧪 Teste Completo do Fluxo de Chat"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar serviços
echo "1️⃣  Verificando Serviços..."
echo ""

# Backend
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend rodando na porta 8000${NC}"
else
    echo -e "${RED}❌ Backend NÃO está rodando${NC}"
    echo "   Inicie com: cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    exit 1
fi

# Frontend
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend rodando na porta 3001${NC}"
else
    echo -e "${RED}❌ Frontend NÃO está rodando${NC}"
    echo "   Inicie com: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣  URLs do Sistema:"
echo "   🌐 Frontend: http://localhost:3001"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo ""

echo "3️⃣  Checklist de Teste Manual:"
echo ""
echo "   📋 PREPARAÇÃO:"
echo "   ☐ Abra http://localhost:3001 no navegador"
echo "   ☐ Abra o Console do Browser (F12)"
echo "   ☐ Vá para a aba 'Console'"
echo ""

echo "   📋 TESTE 1 - LOGIN E STORES:"
echo "   ☐ Faça login no sistema"
echo "   ☐ Verifique logs no console:"
echo "      - Procure: '🔄 Carregando RAG Stores para usuário:'"
echo "      - Procure: '📦 RAG Stores carregados:'"
echo "      - Procure: '📊 Stores com documentos:'"
echo ""

echo "   📋 TESTE 2 - UPLOAD DE DOCUMENTO:"
echo "   ☐ Navegue para 'Documentos'"
echo "   ☐ Selecione um Store/Departamento"
echo "   ☐ Faça upload de 1 PDF pequeno"
echo "   ☐ Aguarde processamento (~5-10 segundos)"
echo "   ☐ Verifique logs no console:"
echo "      - '🔄 Atualizando contagem de documentos nos stores após upload...'"
echo "      - '✅ Documento \"arquivo.pdf\" processado com sucesso!'"
echo "      - '🔄 Atualizando contagem de documentos nos stores...'"
echo "      - '✅ Store \"NomeDoStore\" atualizado: X documentos'"
echo ""

echo "   📋 TESTE 3 - DETECÇÃO DE DOCUMENTOS:"
echo "   ☐ Navegue para 'Chat'"
echo "   ☐ Verifique logs no console:"
echo "      - '🔍 Verificação de documentos: { hasDocuments: true, ... }'"
echo "      - '🔄 Auto-iniciando chat...'"
echo "      - '📦 Stores com documentos: X'"
echo "      - '📦 Iniciando chat com store: NomeDoStore'"
echo ""

echo "   📋 TESTE 4 - ENVIAR MENSAGEM:"
echo "   ☐ O chat deve ter iniciado automaticamente"
echo "   ☐ Digite uma pergunta sobre o documento"
echo "   ☐ Clique em 'Enviar'"
echo "   ☐ Aguarde resposta da IA"
echo "   ☐ Verifique se a resposta é coerente"
echo ""

echo "   📋 TESTE 5 - DASHBOARD:"
echo "   ☐ Navegue para 'Dashboard'"
echo "   ☐ Verifique se o card do Store mostra a contagem correta"
echo "   ☐ O número deve corresponder aos documentos enviados"
echo ""

echo "4️⃣  Logs Importantes do Console:"
echo ""
echo "   ${YELLOW}Logs de Detecção (devem aparecer ao navegar para Chat):${NC}"
echo "   🔍 Verificação de documentos: {"
echo "      hasStoresWithDocs: true,"
echo "      hasCompletedDocs: true,"
echo "      hasDocuments: true,"
echo "      storesWithDocs: [ ... ]"
echo "   }"
echo ""
echo "   ${YELLOW}Logs de Atualização (após upload completar):${NC}"
echo "   ✅ Documento \"arquivo.pdf\" processado com sucesso!"
echo "   🔄 Atualizando contagem de documentos nos stores..."
echo "   ✅ Store \"NomeDoStore\" atualizado: 5 documentos"
echo ""

echo "5️⃣  Problemas Comuns:"
echo ""
echo "   ${RED}❌ Chat não detecta arquivos:${NC}"
echo "      - Verifique se document_count > 0 nos logs"
echo "      - Verifique se processamento completou (status: 'completed')"
echo "      - Procure no console: 'Stores com documentos: 0'"
echo ""
echo "   ${RED}❌ Contagem não atualiza:${NC}"
echo "      - Aguarde pelo menos 2-4 segundos após upload"
echo "      - Procure logs de atualização no console"
echo "      - Recarregue a página (F5) como último recurso"
echo ""
echo "   ${RED}❌ Erro ao iniciar chat:${NC}"
echo "      - Verifique terminal do backend para erros"
echo "      - Procure por 'rag_store_name' nos logs"
echo "      - Verifique se GEMINI_API_KEY está configurada"
echo ""

echo "6️⃣  Monitoramento do Backend:"
echo ""
echo "   Abra outro terminal e execute:"
echo "   ${YELLOW}tail -f backend/logs/app.log${NC} (se houver)"
echo ""
echo "   Ou observe o terminal onde o backend está rodando"
echo "   Procure por logs que começam com:"
echo "   - 🔍 DEBUG BACKEND: create_chat_session"
echo "   - 📦 RAG Store Name recebido:"
echo "   - ✅ ou ❌ Resultado da validação"
echo ""

echo "===================================="
echo "✨ Sistema pronto para teste!"
echo ""
echo "🎯 Objetivo: Verificar que após upload de documento:"
echo "   1. Contagem atualiza automaticamente nos stores"
echo "   2. Chat detecta documentos disponíveis"
echo "   3. Chat inicia automaticamente ao navegar"
echo "   4. Mensagens funcionam corretamente"
echo ""
echo "📝 Anote qualquer erro que aparecer no console!"
echo "===================================="
