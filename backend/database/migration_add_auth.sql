-- Migration: Add Authentication Fields
-- Adiciona campos necessários para autenticação JWT

-- Adicionar campo password_hash à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Adicionar campos de controle de sessão
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Tabela para refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Atualizar usuários existentes com senha padrão (admin123)
-- Hash bcrypt de 'admin123' com salt rounds=12
-- IMPORTANTE: Mudar senha no primeiro login em produção!
UPDATE users
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHSkVy'
WHERE password_hash IS NULL;

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE 'Migration add_auth executada com sucesso!';
    RAISE NOTICE 'IMPORTANTE: Todos os usuários têm senha padrão "admin123". Altere em produção!';
END $$;
