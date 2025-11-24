.PHONY: help network up down logs status restart dev build install
.PHONY: minio-up minio-down minio-logs minio-console minio-reset
.PHONY: postgres-logs redis-logs health

help: ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

network: ## Cria a rede Docker stack-network
	@docker network inspect stack-network >/dev/null 2>&1 || \
	docker network create stack-network && \
	echo "✓ Rede stack-network criada/verificada"

# Comandos Gerais
up: network ## Inicia todos os serviços
	@echo "Iniciando todos os serviços..."
	@docker compose up -d
	@echo "✓ Serviços iniciados"
	@make status

down: ## Para todos os serviços
	@echo "Parando todos os serviços..."
	@docker compose down
	@echo "✓ Serviços parados"

restart: ## Reinicia todos os serviços
	@echo "Reiniciando todos os serviços..."
	@docker compose restart
	@echo "✓ Serviços reiniciados"

logs: ## Mostra os logs de todos os serviços
	@docker compose logs -f

status: ## Mostra o status dos serviços
	@docker compose ps

minio-up: network ## Inicia o MinIO
	@echo "Iniciando MinIO..."
	@docker compose up -d minio
	@echo "✓ MinIO iniciado"
	@echo "  Console: http://localhost:9001"
	@echo "  API: http://localhost:9000"
	@echo "  Usuário: admin"
	@echo "  Senha: admin123456"

minio-down: ## Para o MinIO
	@echo "Parando MinIO..."
	@docker compose down
	@echo "✓ MinIO parado"

minio-logs: ## Mostra os logs do MinIO
	@docker compose logs -f minio

minio-console: ## Abre o console do MinIO no navegador
	@echo "Abrindo console do MinIO em http://localhost:9001"
	@xdg-open http://localhost:9001 2>/dev/null || open http://localhost:9001 2>/dev/null || echo "Acesse: http://localhost:9001"

dev: ## Inicia o servidor de desenvolvimento
	@npm run dev

build: ## Compila o projeto
	@npm run build

install: ## Instala as dependências
	@npm install

minio-reset: ## Remove volumes e reinicia o MinIO
	@echo "⚠️  Isso irá remover todos os dados do MinIO!"
	@read -p "Tem certeza? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		docker compose up -d minio; \
		echo "✓ MinIO resetado"; \
	else \
		echo "Operação cancelada"; \
	fi

# Logs individuais
postgres-logs: ## Mostra logs do PostgreSQL
	@docker compose logs -f postgres

redis-logs: ## Mostra logs do Redis
	@docker compose logs -f redis

# Healthcheck
health: ## Verifica a saúde de todos os serviços
	@echo "=== Status dos Serviços ChatSUA ==="
	@echo ""
	@echo "PostgreSQL (porta 5432):"
	@docker exec chatsua-postgres pg_isready -U postgres 2>/dev/null && echo "  ✓ Healthy" || echo "  ✗ Unhealthy"
	@echo ""
	@echo "Redis (porta 6379):"
	@docker exec chatsua-redis redis-cli ping 2>/dev/null && echo "  ✓ Healthy" || echo "  ✗ Unhealthy"
	@echo ""
	@echo "MinIO (portas 9000, 9001):"
	@curl -sf http://localhost:9000/minio/health/live >/dev/null && echo "  ✓ Healthy" || echo "  ✗ Unhealthy"
	@echo ""
	@echo "Frontend (porta 3001):"
	@curl -sf http://localhost:3001 >/dev/null && echo "  ✓ Running" || echo "  ✗ Not Running"
