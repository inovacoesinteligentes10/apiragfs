-- Migration: Add department/store support for multi-tenant RAG
-- Created: 2025-01-25
-- Description: Allows users to organize documents in different stores (RH, Compras, TI, etc.)

-- Create stores/departments table
CREATE TABLE IF NOT EXISTS rag_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(20) DEFAULT 'blue',
    document_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Add department/store reference to documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_rag_stores_user_id ON rag_stores(user_id);

-- Insert default stores for existing users
INSERT INTO rag_stores (user_id, name, display_name, description, icon, color)
VALUES
    ('default-user', 'geral', 'Geral', 'Documentos gerais e diversos', 'folder', 'blue'),
    ('default-user', 'rh', 'Recursos Humanos', 'Documentos de RH, folha de pagamento, contratos', 'users', 'purple'),
    ('default-user', 'compras', 'Compras', 'Orçamentos, pedidos, notas fiscais', 'shopping-cart', 'green'),
    ('default-user', 'ti', 'TI', 'Documentação técnica, manuais, procedimentos', 'cpu', 'red'),
    ('default-user', 'juridico', 'Jurídico', 'Contratos, processos, documentos legais', 'shield', 'yellow'),
    ('default-user', 'financeiro', 'Financeiro', 'Balanços, relatórios financeiros, auditorias', 'dollar-sign', 'orange')
ON CONFLICT (user_id, name) DO NOTHING;

-- Comments
COMMENT ON TABLE rag_stores IS 'Stores/Departments for organizing documents in separate RAG contexts';
COMMENT ON COLUMN documents.department IS 'Department/Store name (e.g., "rh", "compras", "ti")';
