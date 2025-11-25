-- Migration: Add metadata support for documents
-- Created: 2025-01-25
-- Description: Adds JSONB column to store custom metadata for File Search API

-- Add metadata column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient metadata queries
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN (metadata);

-- Add comment
COMMENT ON COLUMN documents.metadata IS 'Custom metadata for Gemini File Search API (author, category, tags, etc.)';

-- Example metadata structure:
-- {
--   "author": "Nome do Autor",
--   "category": "Categoria do Documento",
--   "tags": ["tag1", "tag2", "tag3"],
--   "year": 2025,
--   "custom_field": "valor personalizado"
-- }
