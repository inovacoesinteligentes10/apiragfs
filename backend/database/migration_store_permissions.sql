-- Migration: Add Store Permissions
-- Implementa controle de acesso aos stores baseado em permissões de usuário
-- Data: 2025-11-25

-- 1. Criar tabela de permissões user-store (many-to-many)
CREATE TABLE IF NOT EXISTS user_store_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES rag_stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(user_id, store_id)
);

-- 2. Criar índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_user_store_permissions_user_id ON user_store_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_store_permissions_store_id ON user_store_permissions(store_id);
CREATE INDEX IF NOT EXISTS idx_user_store_permissions_created_at ON user_store_permissions(created_at DESC);

-- 3. Modificar tabela rag_stores para usar UUID ao invés de VARCHAR
-- Primeiro, vamos adicionar uma nova coluna temporária
ALTER TABLE rag_stores ADD COLUMN IF NOT EXISTS user_id_new UUID;

-- 4. Buscar o UUID do primeiro usuário admin para usar como padrão
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Buscar primeiro usuário admin
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;

    -- Se não houver admin, criar um usuário padrão
    IF admin_user_id IS NULL THEN
        INSERT INTO users (email, name, role, password_hash, is_active)
        VALUES (
            'admin@apiragfs.dev',
            'Administrador',
            'admin',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHSkVy', -- senha: admin123
            TRUE
        )
        ON CONFLICT (email) DO UPDATE SET role = 'admin'
        RETURNING id INTO admin_user_id;
    END IF;

    -- Atualizar stores existentes para usar o UUID do admin
    UPDATE rag_stores SET user_id_new = admin_user_id WHERE user_id_new IS NULL;
END $$;

-- 5. Remover a coluna antiga e renomear a nova
ALTER TABLE rag_stores DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE rag_stores RENAME COLUMN user_id_new TO user_id;

-- 6. Adicionar constraint NOT NULL e FK
ALTER TABLE rag_stores ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE rag_stores ADD CONSTRAINT fk_rag_stores_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. Criar índice na nova coluna user_id
CREATE INDEX IF NOT EXISTS idx_rag_stores_user_id ON rag_stores(user_id);

-- 8. Popular permissões para stores existentes
DO $$
DECLARE
    store_record RECORD;
    admin_record RECORD;
BEGIN
    -- Para cada store existente
    FOR store_record IN SELECT id, user_id FROM rag_stores
    LOOP
        -- Adicionar permissão para o criador do store
        INSERT INTO user_store_permissions (user_id, store_id, created_by)
        VALUES (store_record.user_id, store_record.id, store_record.user_id)
        ON CONFLICT (user_id, store_id) DO NOTHING;

        -- Adicionar permissões para todos os administradores
        FOR admin_record IN SELECT id FROM users WHERE role = 'admin' AND id != store_record.user_id
        LOOP
            INSERT INTO user_store_permissions (user_id, store_id, created_by)
            VALUES (admin_record.id, store_record.id, store_record.user_id)
            ON CONFLICT (user_id, store_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 9. Criar função para adicionar permissões automaticamente quando um store é criado
CREATE OR REPLACE FUNCTION auto_add_store_permissions()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Adicionar permissão para o criador
    INSERT INTO user_store_permissions (user_id, store_id, created_by)
    VALUES (NEW.user_id, NEW.id, NEW.user_id)
    ON CONFLICT (user_id, store_id) DO NOTHING;

    -- Adicionar permissões para todos os admins (exceto se o criador já for admin)
    FOR admin_user IN SELECT id FROM users WHERE role = 'admin' AND id != NEW.user_id
    LOOP
        INSERT INTO user_store_permissions (user_id, store_id, created_by)
        VALUES (admin_user.id, NEW.id, NEW.user_id)
        ON CONFLICT (user_id, store_id) DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_auto_add_store_permissions ON rag_stores;
CREATE TRIGGER trigger_auto_add_store_permissions
    AFTER INSERT ON rag_stores
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_store_permissions();

-- 11. Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Migration store_permissions executada com sucesso!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Alterações realizadas:';
    RAISE NOTICE '- Tabela user_store_permissions criada';
    RAISE NOTICE '- Campo user_id em rag_stores convertido para UUID';
    RAISE NOTICE '- Permissões criadas para stores existentes';
    RAISE NOTICE '- Trigger automático configurado para novos stores';
    RAISE NOTICE '=================================================';
END $$;
