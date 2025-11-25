# Multi-stage build para otimização
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage de produção
FROM node:20-alpine AS production

WORKDIR /app

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar apenas os arquivos necessários do build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expor porta
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3001 || exit 0

# Comando para iniciar a aplicação
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3001"]
