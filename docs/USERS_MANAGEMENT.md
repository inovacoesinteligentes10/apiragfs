# Gerenciamento de Usuários - ApiRAGFS

## Visão Geral

Sistema completo de gerenciamento de usuários para a plataforma ApiRAGFS, incluindo:

- ✅ CRUD completo de usuários (Create, Read, Update, Delete)
- ✅ Controle de permissões baseado em roles (Admin, Professor, Student)
- ✅ Autenticação JWT
- ✅ Interface administrativa completa
- ✅ Estatísticas e métricas de usuários

## Backend API

### Endpoints Disponíveis

#### 1. Listar Usuários
```
GET /api/v1/users
```

**Permissão:** Admin apenas

**Parâmetros de Query:**
- `role` (opcional): Filtrar por role (student, professor, admin)
- `is_active` (opcional): Filtrar por status (true/false)
- `search` (opcional): Buscar por nome ou email
- `limit` (opcional): Limite de resultados (padrão: 100)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Resposta:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "role": "student",
    "is_active": true,
    "created_at": "2025-11-25T00:00:00",
    "last_login": "2025-11-25T12:00:00",
    "stats": {
      "total_documents": 10,
      "total_sessions": 5,
      "total_messages": 50
    }
  }
]
```

#### 2. Obter Estatísticas de Usuários
```
GET /api/v1/users/stats
```

**Permissão:** Admin apenas

**Resposta:**
```json
{
  "total_users": 100,
  "active_users": 85,
  "inactive_users": 15,
  "admin_count": 5,
  "professor_count": 20,
  "student_count": 75,
  "new_users_week": 10,
  "active_users_week": 60
}
```

#### 3. Obter Usuário por ID
```
GET /api/v1/users/{user_id}
```

**Permissão:** Admin apenas

**Resposta:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nome do Usuário",
  "role": "student",
  "is_active": true,
  "created_at": "2025-11-25T00:00:00",
  "last_login": "2025-11-25T12:00:00"
}
```

#### 4. Criar Novo Usuário
```
POST /api/v1/users
```

**Permissão:** Admin apenas

**Payload:**
```json
{
  "email": "newuser@example.com",
  "name": "Novo Usuário",
  "role": "student",
  "password": "senha123"
}
```

**Resposta:** Retorna o usuário criado (status 201)

#### 5. Atualizar Usuário
```
PUT /api/v1/users/{user_id}
```

**Permissão:** Admin apenas

**Payload:**
```json
{
  "email": "updated@example.com",
  "name": "Nome Atualizado",
  "role": "professor",
  "is_active": true,
  "password": "novasenha123"
}
```

**Nota:** Todos os campos são opcionais. Apenas os campos fornecidos serão atualizados.

#### 6. Deletar Usuário
```
DELETE /api/v1/users/{user_id}
```

**Permissão:** Admin apenas

**Resposta:** Status 204 No Content

**Restrições:**
- Admin não pode deletar a si mesmo

#### 7. Alternar Status do Usuário
```
PATCH /api/v1/users/{user_id}/toggle-status
```

**Permissão:** Admin apenas

**Resposta:** Retorna o usuário com status atualizado

**Restrições:**
- Admin não pode desativar a si mesmo

## Frontend - Interface de Gerenciamento

### Localização
```
/components/UsersManagement.tsx
```

### Funcionalidades

#### 1. Dashboard de Estatísticas
- Total de usuários
- Usuários ativos
- Novos usuários (últimos 7 dias)
- Usuários ativos (últimos 7 dias)

#### 2. Filtros Avançados
- **Busca por texto:** Nome ou email
- **Filtro por role:** Admin, Professor, Student
- **Filtro por status:** Ativos, Inativos, Todos

#### 3. Tabela de Usuários
Exibe:
- Nome e email
- Badge de role com cores distintas
- Status ativo/inativo
- Estatísticas (documentos, sessões)
- Último acesso
- Ações (Editar, Ativar/Desativar, Deletar)

#### 4. Modal de Criação/Edição
Campos:
- Nome (obrigatório)
- Email (obrigatório, validado)
- Função/Role (dropdown)
- Senha (obrigatória na criação, opcional na edição)
- Status ativo (checkbox, apenas na edição)

#### 5. Confirmação de Exclusão
Modal de confirmação antes de deletar usuário

### Acesso à Interface

1. Faça login como administrador
2. No menu lateral, acesse **Administração > Gerenciar Usuários**

## Roles e Permissões

### Admin
- Acesso total ao sistema
- Pode gerenciar outros usuários
- Pode acessar todas as funcionalidades

### Professor
- Pode criar e gerenciar conteúdo
- Pode acessar analytics
- Acesso limitado às configurações

### Student
- Pode fazer upload de documentos
- Pode usar o chat IA
- Acesso básico ao sistema

## Segurança

### Autenticação
- JWT (JSON Web Tokens)
- Access Token: 30 minutos de validade
- Refresh Token: 7 dias de validade
- Tokens armazenados no localStorage

### Autorização
- Middleware `require_admin` protege todos os endpoints de gerenciamento
- Verificação de role em cada requisição
- Usuários inativos são bloqueados automaticamente

### Boas Práticas
- Senhas são hasheadas com bcrypt (12 rounds)
- Validação de email
- Senha mínima de 6 caracteres
- Proteção contra auto-exclusão/desativação de admin

## Estrutura de Arquivos

### Backend
```
backend/
├── app/
│   ├── api/v1/
│   │   └── users.py          # Endpoints de gerenciamento
│   ├── schemas/
│   │   ├── auth.py            # Schemas de autenticação
│   │   └── user.py            # Schemas de usuário
│   ├── middleware/
│   │   └── auth.py            # Middleware de autenticação
│   └── main.py                # Registro de rotas
```

### Frontend
```
frontend/
├── components/
│   ├── UsersManagement.tsx   # Componente principal
│   └── Sidebar.tsx           # Menu lateral (rota adicionada)
├── App.tsx                   # Integração do componente
└── types.ts                  # Tipos TypeScript
```

## Testes Manuais

### 1. Criar Usuário Admin de Teste

```bash
# Registrar usuário admin
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "name": "Admin Teste",
    "role": "admin",
    "password": "admin123"
  }'
```

### 2. Fazer Login

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'

# Guarde o access_token da resposta
```

### 3. Listar Usuários

```bash
# Listar todos os usuários
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer {seu_token_aqui}"
```

### 4. Criar Novo Usuário

```bash
# Criar usuário
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer {seu_token_aqui}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "name": "Estudante Teste",
    "role": "student",
    "password": "student123"
  }'
```

### 5. Atualizar Usuário

```bash
# Atualizar usuário
curl -X PUT http://localhost:8000/api/v1/users/{user_id} \
  -H "Authorization: Bearer {seu_token_aqui}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nome Atualizado",
    "role": "professor"
  }'
```

### 6. Alternar Status

```bash
# Ativar/Desativar usuário
curl -X PATCH http://localhost:8000/api/v1/users/{user_id}/toggle-status \
  -H "Authorization: Bearer {seu_token_aqui}"
```

### 7. Deletar Usuário

```bash
# Deletar usuário
curl -X DELETE http://localhost:8000/api/v1/users/{user_id} \
  -H "Authorization: Bearer {seu_token_aqui}"
```

## Próximos Passos

### Melhorias Futuras
- [ ] Paginação avançada no frontend
- [ ] Export de lista de usuários (CSV/Excel)
- [ ] Envio de email de boas-vindas
- [ ] Reset de senha por email
- [ ] Histórico de atividades do usuário
- [ ] Grupos de permissões customizados
- [ ] Autenticação de dois fatores (2FA)
- [ ] Integração com SSO/LDAP

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do backend: `docker logs apiragfs-backend`
2. Verifique o console do navegador (F12)
3. Consulte a documentação da API: http://localhost:8000/docs

## Changelog

### v1.0.0 (2025-11-25)
- ✅ Implementação inicial do sistema de gerenciamento de usuários
- ✅ CRUD completo de usuários
- ✅ Interface administrativa
- ✅ Estatísticas e métricas
- ✅ Filtros e busca avançada
- ✅ Controle de permissões por role
