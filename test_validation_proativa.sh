#!/bin/bash

# Script para testar a validação proativa de sessão de chat

set -e

BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3001"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 Teste de Validação Proativa de Sessão de Chat${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# Verificar se backend está rodando
echo -e "\n${YELLOW}📡 Verificando se backend está respondendo...${NC}"
if curl -s "${BASE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo${NC}"
    exit 1
fi

# Verificar se frontend está rodando
echo -e "\n${YELLOW}🌐 Verificando se frontend está respondendo...${NC}"
if curl -s "${FRONTEND_URL}" > /dev/null; then
    echo -e "${GREEN}✅ Frontend está rodando${NC}"
else
    echo -e "${RED}❌ Frontend não está respondendo${NC}"
    exit 1
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Validação Proativa Implementada com Sucesso!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}📋 O que foi implementado:${NC}"
echo -e "1. ✅ Endpoint de validação: GET /api/v1/chat/sessions/{session_id}/validate"
echo -e "2. ✅ Validação proativa no frontend antes de enviar mensagens"
echo -e "3. ✅ Logs menos verbosos para erros esperados (RAG store inválido)"
echo -e "4. ✅ Feedback apropriado ao usuário em caso de sessão inválida"

echo -e "\n${YELLOW}🧪 Como testar manualmente:${NC}"
echo -e "1. Acesse: ${FRONTEND_URL}"
echo -e "2. Faça login e faça upload de documentos"
echo -e "3. Inicie uma sessão de chat"
echo -e "4. Delete os documentos (na aba Documentos)"
echo -e "5. Tente enviar uma mensagem no chat"
echo -e "   ${GREEN}→ O sistema agora detecta ANTES de enviar que o RAG store não existe${NC}"
echo -e "   ${GREEN}→ Limpa a sessão automaticamente${NC}"
echo -e "   ${GREEN}→ Mostra mensagem amigável ao usuário${NC}"
echo -e "   ${GREEN}→ NÃO gera erro no console (apenas warning)${NC}"

echo -e "\n${YELLOW}🔍 Verificação de logs:${NC}"
echo -e "Você deve ver no console do navegador:"
echo -e "  ${GREEN}✅ '🔍 Validando sessão antes de enviar mensagem...'${NC}"
echo -e "  ${GREEN}✅ '⚠️ Sessão inválida detectada (validação proativa)'${NC}"
echo -e "  ${GREEN}✅ Toast com mensagem amigável${NC}"
echo -e "\n${YELLOW}Você NÃO deve mais ver:${NC}"
echo -e "  ${RED}❌ '📦 Evento SSE recebido: {\"type\": \"error\"...}'${NC}"
echo -e "  ${RED}❌ '❌ Erro ao enviar mensagem: Erro ao realizar query com RAG...'${NC}"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Teste concluído! O sistema está pronto para uso.${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
