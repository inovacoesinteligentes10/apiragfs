-- Migração: Remover campos document_id e document_name da tabela chat_sessions
-- Data: 2025-01-25

-- Remover colunas desnecessárias (documento específico não é mais necessário)
ALTER TABLE chat_sessions DROP COLUMN IF EXISTS document_id;
ALTER TABLE chat_sessions DROP COLUMN IF EXISTS document_name;

-- Tornar rag_store_name obrigatório
ALTER TABLE chat_sessions ALTER COLUMN rag_store_name SET NOT NULL;

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE 'Migração concluída: Campos document_id e document_name removidos!';
END $$;
