-- Migration: Convert documents.user_id from VARCHAR to UUID
-- Data: 2025-11-26

-- 1. Criar coluna temporária UUID
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id_new UUID;

-- 2. Converter valores existentes de VARCHAR para UUID
-- Se user_id for um UUID válido, converte. Senão, busca o admin padrão
DO $$
DECLARE
    admin_user_id UUID;
    doc_record RECORD;
BEGIN
    -- Buscar admin padrão
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;

    -- Para cada documento
    FOR doc_record IN SELECT id, user_id FROM documents
    LOOP
        BEGIN
            -- Tentar converter user_id para UUID
            UPDATE documents
            SET user_id_new = doc_record.user_id::UUID
            WHERE id = doc_record.id;
        EXCEPTION WHEN OTHERS THEN
            -- Se falhar, usar admin padrão
            UPDATE documents
            SET user_id_new = admin_user_id
            WHERE id = doc_record.id;

            RAISE NOTICE 'Documento % convertido para admin (user_id inválido: %)',
                doc_record.id, doc_record.user_id;
        END;
    END LOOP;
END $$;

-- 3. Remover coluna antiga e renomear nova
ALTER TABLE documents DROP COLUMN user_id;
ALTER TABLE documents RENAME COLUMN user_id_new TO user_id;

-- 4. Adicionar NOT NULL constraint
ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;

-- 5. Adicionar Foreign Key
ALTER TABLE documents
ADD CONSTRAINT fk_documents_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. Criar índice
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- 7. Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Migration documents_user_id_uuid executada!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Campo user_id convertido de VARCHAR para UUID';
    RAISE NOTICE '=================================================';
END $$;
