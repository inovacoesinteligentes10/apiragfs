# MinIO - Armazenamento de Objetos

Este projeto utiliza MinIO para armazenamento distribuído de arquivos.

## 🚀 Configuração Rápida

### Pré-requisitos
- Docker e Docker Compose instalados
- Rede Docker `stack-network` criada

### Iniciar MinIO

```bash
# Criar a rede Docker (se não existir)
make network

# Iniciar o MinIO
make minio-up
```

O MinIO estará disponível em:
- **Console Web**: http://localhost:9001
- **API**: http://localhost:9000

### Credenciais Padrão
- **Usuário**: `admin`
- **Senha**: `admin123456`

## 📋 Comandos Disponíveis

```bash
make help              # Mostra todos os comandos disponíveis
make minio-up          # Inicia o MinIO
make minio-down        # Para o MinIO
make minio-logs        # Mostra os logs do MinIO
make minio-console     # Abre o console do MinIO no navegador
make minio-reset       # Remove volumes e reinicia o MinIO
make status            # Mostra o status dos serviços
```

## 🔧 Configuração

### Estrutura do Docker Compose

```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: admin123456
    volumes:
      - minio-data:/data
    networks:
      - stack-network
```

### Healthcheck

O MinIO possui healthcheck configurado para garantir disponibilidade:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
  interval: 30s
  timeout: 20s
  retries: 3
```

## 💾 Armazenamento

### Buckets Padrão
- `chatsua-documents`: Armazena documentos carregados pelos usuários

### Estrutura de Arquivos
```
chatsua-documents/
  ├── {timestamp}-{filename}.pdf
  ├── {timestamp}-{filename}.txt
  └── ...
```

## 🔒 Segurança

### Produção
Para ambientes de produção, **altere as credenciais padrão**:

1. Edite o arquivo `docker-compose.yml`:
```yaml
environment:
  MINIO_ROOT_USER: seu_usuario_seguro
  MINIO_ROOT_PASSWORD: sua_senha_muito_segura
```

2. Atualize também em `services/minioService.ts`:
```typescript
this.config = {
    endpoint: 'localhost',
    port: 9000,
    accessKey: 'seu_usuario_seguro',
    secretKey: 'sua_senha_muito_segura',
    useSSL: false
};
```

### SSL/TLS
Para habilitar HTTPS:

1. Configure certificados SSL
2. Atualize `useSSL: true` no serviço
3. Use porta 443 para API

## 📊 Monitoramento

### Console Web
Acesse http://localhost:9001 para:
- Visualizar buckets e objetos
- Gerenciar permissões
- Monitorar uso de armazenamento
- Configurar políticas de acesso

### API Status
Endpoint de health: http://localhost:9000/minio/health/live

### Através da Aplicação
A página **Status dos Serviços** no ChatSUA exibe:
- Status do MinIO (Online/Offline)
- Espaço usado
- Total de arquivos
- Espaço disponível
- Link direto para o console

## 🛠️ Integração com a Aplicação

### Serviço MinIO
O arquivo `services/minioService.ts` fornece:

```typescript
// Upload de arquivo
await minioService.uploadFile(file, 'chatsua-documents');

// Listar arquivos
const files = await minioService.listFiles('chatsua-documents');

// Deletar arquivo
await minioService.deleteFile(fileId, 'chatsua-documents');

// Estatísticas
const stats = await minioService.getStorageStats();

// Status
const status = await minioService.getStatus();
```

## 🔄 Backup e Recuperação

### Backup Manual
```bash
# Backup do volume
docker run --rm \
  -v chatsua-minio-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz /data

# Restaurar backup
docker run --rm \
  -v chatsua-minio-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/minio-backup-YYYYMMDD.tar.gz -C /
```

### Sincronização
Use `mc` (MinIO Client) para sincronização entre instâncias:

```bash
# Instalar mc
brew install minio/stable/mc

# Configurar alias
mc alias set local http://localhost:9000 admin admin123456

# Espelhar bucket
mc mirror local/chatsua-documents /caminho/backup
```

## 🐛 Troubleshooting

### MinIO não inicia
```bash
# Verificar logs
make minio-logs

# Verificar se a porta está em uso
lsof -i :9000
lsof -i :9001

# Recriar container
make minio-down
make minio-up
```

### Espaço em disco cheio
```bash
# Verificar uso do volume
docker system df -v

# Limpar objetos antigos via console ou API
```

### Problemas de permissão
```bash
# Resetar volumes e permissões
make minio-reset
```

## 📚 Recursos Adicionais

- [Documentação Oficial MinIO](https://min.io/docs/minio/linux/index.html)
- [MinIO Client (mc)](https://min.io/docs/minio/linux/reference/minio-mc.html)
- [SDK JavaScript](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)

## 🌐 URLs Importantes

- Console MinIO: http://localhost:9001
- API MinIO: http://localhost:9000
- Health Check: http://localhost:9000/minio/health/live
- Status na Aplicação: http://localhost:3001 → Sistema → Status dos Serviços
