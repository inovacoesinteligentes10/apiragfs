#!/bin/bash
# Script simples para verificar e limpar documentos órfãos

echo "========================================================================"
echo "🔄 SINCRONIZAÇÃO DE RAG STORES - Versão Simplificada"
echo "========================================================================"
echo ""

# Conectar ao PostgreSQL e buscar documentos com RAG stores
echo "📊 Buscando documentos no banco de dados..."
echo ""

docker exec apiragfs-postgres psql -U postgres -d apiragfs -c "
SELECT 
    id, 
    name, 
    rag_store_name, 
    status 
FROM documents 
WHERE rag_store_name IS NOT NULL 
ORDER BY created_at DESC;
"

echo ""
echo "========================================================================"
echo "💡 PRÓXIMOS PASSOS:"
echo "========================================================================"
echo ""
echo "Para marcar documentos órfãos como erro, execute:"
echo ""
echo "docker exec apiragfs-postgres psql -U postgres -d apiragfs -c \""
echo "UPDATE documents"
echo "SET status = 'error',"
echo "    error_message = 'RAG store não existe mais no Gemini. Faça upload novamente.',"
echo "    rag_store_name = NULL"
echo "WHERE rag_store_name IN ("
echo "    'fileSearchStores/jurdico-bfff76fde8ac4792aaf-w3gwizclpjh9',"
echo "    'fileSearchStores/suaunifesp-bfff76fde8ac4792-ed2tg8em5im4'"
echo ");\""
echo ""
echo "========================================================================"
