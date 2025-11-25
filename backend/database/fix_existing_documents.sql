-- Script para corrigir documentos existentes sem rag_store_name
-- Este script marca documentos sem rag_store_name para reprocessamento

-- Opção 1: Deletar documentos sem rag_store_name (RECOMENDADO para poucos documentos)
-- DELETE FROM documents WHERE rag_store_name IS NULL;

-- Opção 2: Marcar para reprocessamento (se quiser manter os documentos)
UPDATE documents
SET
    status = 'uploaded',
    progress_percent = 0,
    status_message = 'Aguardando reprocessamento...',
    rag_store_name = NULL,
    updated_at = NOW()
WHERE rag_store_name IS NULL AND status = 'completed';

-- Mensagem
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Documentos atualizados: %', affected_rows;
    RAISE NOTICE 'Para reprocessar, faça upload novamente dos documentos.';
END $$;
