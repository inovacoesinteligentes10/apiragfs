-- Migração: Adicionar campos de progresso detalhado
-- Data: 2025-11-24

-- Adicionar novos campos à tabela documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status_message VARCHAR(255);

-- Atualizar o check constraint do status para incluir novos status
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
    CHECK (status IN ('uploaded', 'extracting', 'chunking', 'embedding', 'indexing', 'completed', 'error'));

-- Atualizar documentos existentes com status 'processing' para 'uploaded'
UPDATE documents SET status = 'uploaded' WHERE status = 'processing';

-- Criar índice para o campo progress_percent
CREATE INDEX IF NOT EXISTS idx_documents_progress ON documents(progress_percent);

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE 'Migração de progresso aplicada com sucesso!';
END $$;
