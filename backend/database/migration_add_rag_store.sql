-- Adicionar coluna rag_store_name na tabela documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS rag_store_name VARCHAR(500);

-- Criar índice para busca por rag_store_name
CREATE INDEX IF NOT EXISTS idx_documents_rag_store ON documents(rag_store_name);
