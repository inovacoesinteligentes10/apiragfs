# 🔐 Credenciais de Acesso - ApiRAGFS

## URLs do Sistema

### Frontend
- **URL**: http://localhost:3001 (porta fixa do projeto)

### Backend API
- **URL**: http://localhost:8000
- **Documentação Swagger**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Usuário Administrador

### Credenciais
```
Email: admin@apiragfs.dev
Senha: admin123
Role: admin
```

### Permissões
- ✅ Acesso total ao sistema
- ✅ Gerenciar usuários (criar, editar, deletar, ativar/desativar)
- ✅ Gerenciar stores/departamentos
- ✅ Visualizar analytics e estatísticas
- ✅ Acessar configurações do sistema
- ✅ Upload de documentos
- ✅ Chat IA
- ✅ Todas as funcionalidades

## Como Acessar o Sistema

### Passo 1: Acessar o Frontend
1. Abra o navegador
2. Acesse: http://localhost:3001
3. Você verá a tela principal do ApiRAGFS

### Passo 2: Fazer Login
1. Clique no botão de **Login** no canto superior direito ou no menu lateral
2. Digite as credenciais:
   - **Email**: `admin@apiragfs.dev`
   - **Senha**: `admin123`
3. Clique em **Entrar**

### Passo 3: Acessar Gerenciamento de Usuários
1. Após o login, no menu lateral esquerdo
2. Navegue para: **Administração > Gerenciar Usuários**
3. Você verá a interface completa de gerenciamento

## Funcionalidades do Gerenciamento de Usuários

### Dashboard de Estatísticas
- 📊 Total de usuários
- ✅ Usuários ativos
- 🆕 Novos usuários (últimos 7 dias)
- ⚡ Usuários ativos (últimos 7 dias)

### Gerenciar Usuários
- 🔍 **Buscar**: Por nome ou email
- 🏷️ **Filtrar**: Por role (Admin, Professor, Student)
- 🔄 **Filtrar**: Por status (Ativo/Inativo)
- ➕ **Criar**: Novo usuário
- ✏️ **Editar**: Informações do usuário
- 🔄 **Ativar/Desativar**: Toggle de status
- 🗑️ **Deletar**: Remover usuário (com confirmação)

### Criar Novo Usuário
1. Clique no botão **+ Novo Usuário**
2. Preencha o formulário:
   - **Nome**: Nome completo do usuário
   - **Email**: Email válido (único no sistema)
   - **Função**: Student, Professor ou Admin
   - **Senha**: Mínimo 6 caracteres
3. Clique em **Criar**

### Editar Usuário
1. Na tabela, clique em **Editar** na linha do usuário
2. Modifique os campos desejados
3. Para alterar a senha, digite uma nova (ou deixe em branco para manter)
4. Clique em **Atualizar**

## Outros Usuários Existentes

### Usuário de Teste (Student)
```
Email: teste@apiragfs.dev
Senha: admin123
Role: student
```

### Usuários Demo
O sistema possui mais 4 usuários de demonstração:
- demo@test.com
- newbie@test.com
- user1@test.com
- test@example.com

**Nota**: Estes usuários foram criados via API e possuem senhas diferentes. Use o admin para gerenciá-los.

## Testando a API Diretamente

### 1. Fazer Login via API

```bash
curl -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@apiragfs.dev",
    "password": "admin123"
  }'
```

**Resposta**: Você receberá um `access_token` que deve ser usado nas próximas requisições.

### 2. Listar Todos os Usuários

```bash
curl -X GET 'http://localhost:8000/api/v1/users' \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI'
```

### 3. Obter Estatísticas

```bash
curl -X GET 'http://localhost:8000/api/v1/users/stats' \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI'
```

### 4. Criar Novo Usuário

```bash
curl -X POST 'http://localhost:8000/api/v1/users' \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "novo@example.com",
    "name": "Novo Usuário",
    "role": "student",
    "password": "senha123"
  }'
```

## Roles e Seus Acessos

### 🔴 Admin (Administrador)
- Acesso total ao sistema
- Pode gerenciar outros usuários
- Pode criar/editar/deletar stores
- Acesso completo a analytics
- Todas as funcionalidades

### 🔵 Professor
- Pode criar e gerenciar conteúdo
- Acesso a analytics básicos
- Upload de documentos
- Chat IA
- Sem acesso ao gerenciamento de usuários

### ⚪ Student (Estudante)
- Upload de documentos
- Chat IA
- Visualização de seus próprios documentos
- Acesso básico ao sistema

## Segurança

### Tokens JWT
- **Access Token**: Válido por 30 minutos
- **Refresh Token**: Válido por 7 dias
- Armazenados no localStorage do navegador

### Senhas
- Hash bcrypt com 12 rounds
- Mínimo de 6 caracteres
- Nunca armazenadas em texto puro

### Proteções
- ✅ Admin não pode deletar a si mesmo
- ✅ Admin não pode desativar a si mesmo
- ✅ Validação de email único
- ✅ Verificação de permissões em todas as rotas
- ✅ Usuários inativos são bloqueados automaticamente

## Troubleshooting

### Não consigo fazer login
1. Verifique se o email está correto
2. Verifique se a senha está correta (case-sensitive)
3. Verifique se o usuário está ativo
4. Verifique os logs do backend: `docker logs apiragfs-backend`

### Token expirado
- Se o access token expirar (30 min), use o refresh token para obter um novo
- Ou faça login novamente

### Não vejo o menu "Gerenciar Usuários"
- Certifique-se de que está logado como Admin
- Apenas usuários com role "admin" podem ver este menu

### Backend não está respondendo
```bash
# Verificar status
docker ps | grep backend

# Verificar logs
docker logs apiragfs-backend --tail 50

# Reiniciar se necessário
docker restart apiragfs-backend
```

### Frontend não carrega
```bash
# Verificar se está rodando
ps aux | grep vite

# Se não estiver, iniciar
cd /media/fmar/Prometheus/DEV/APIRagFST
npm run dev
```

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker logs apiragfs-backend`
2. Verifique o console do navegador (F12)
3. Consulte: `docs/USERS_MANAGEMENT.md`
4. Consulte a API docs: http://localhost:8000/docs

## Changelog

### 2025-11-26
- ✅ Criado usuário admin: admin@apiragfs.dev
- ✅ Senha configurada: admin123
- ✅ Sistema de gerenciamento de usuários implementado
- ✅ Interface administrativa completa
- ✅ API REST completa para gerenciamento
