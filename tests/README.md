# Testes E2E com Playwright

Este diretório contém os testes end-to-end (E2E) para o projeto APIRagFST usando Playwright.

## 📁 Estrutura

```
tests/
├── e2e/                    # Testes E2E
│   ├── auth.spec.ts       # Testes de autenticação
│   ├── documents.spec.ts  # Testes de documentos
│   └── chat.spec.ts       # Testes de chat
├── fixtures/              # Dados de teste
│   └── test-document.txt  # Documento de teste
└── helpers/               # Funções auxiliares
    ├── auth.helper.ts     # Helpers de autenticação
    └── navigation.helper.ts # Helpers de navegação
```

## 🚀 Executando os Testes

### Pré-requisitos

1. Instale as dependências:
```bash
npm install
```

2. Instale os navegadores do Playwright:
```bash
npx playwright install
```

3. Certifique-se de que o backend está rodando em `http://localhost:8000`

### Comandos Disponíveis

```bash
# Executar todos os testes (headless)
npm test

# Executar com interface visual
npm run test:ui

# Executar com navegador visível
npm run test:headed

# Executar em modo debug
npm run test:debug

# Ver relatório HTML dos testes
npm run test:report

# Executar apenas em um navegador específico
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

## 📝 Suites de Teste

### 1. Autenticação (`auth.spec.ts`)
Testa funcionalidades de login, logout e controle de acesso:
- ✅ Exibir página inicial
- ✅ Modal de login
- ✅ Login com credenciais válidas
- ✅ Erro com credenciais inválidas
- ✅ Logout
- ✅ Bloqueio de acesso sem autenticação

### 2. Documentos (`documents.spec.ts`)
Testa upload e gerenciamento de documentos:
- ✅ Exibir página de documentos
- ✅ Bloquear upload sem autenticação
- ✅ Selecionar arquivo para upload
- ✅ Mostrar stores disponíveis
- ✅ Listar documentos processados
- ✅ Deletar documento
- ✅ Status de processamento
- ✅ Filtrar por store

### 3. Chat (`chat.spec.ts`)
Testa funcionalidades de chat com IA:
- ✅ Mensagem quando não há documentos
- ✅ Iniciar chat automaticamente
- ✅ Criar novo chat
- ✅ Enviar mensagem e receber resposta
- ✅ Histórico de mensagens
- ✅ Loading durante resposta
- ✅ Visualizar chats anteriores
- ✅ Trocar de store
- ✅ Mostrar fontes/grounding chunks

## 🔧 Configuração

### playwright.config.ts

Principais configurações:
- **Base URL**: `http://localhost:3001`
- **Timeout**: 30 segundos por teste
- **Retries**: 2 tentativas no CI
- **Navegadores**: Chromium, Firefox, WebKit
- **Reporter**: HTML, List, JSON
- **Screenshots**: Apenas em falhas
- **Videos**: Apenas em falhas

### Variáveis de Ambiente

Crie um arquivo `.env.test` se necessário:
```env
BASE_URL=http://localhost:3001
API_URL=http://localhost:8000
TEST_USERNAME=admin
TEST_PASSWORD=admin123
```

## 📊 Relatórios

Após executar os testes, um relatório HTML é gerado automaticamente:

```bash
npm run test:report
```

O relatório inclui:
- Screenshots de falhas
- Vídeos de execução
- Traces para debug
- Logs detalhados

## 🐛 Debug

### Debug de um teste específico:

```bash
npx playwright test auth.spec.ts --debug
```

### Ver trace de uma falha:

```bash
npx playwright show-trace trace.zip
```

### Codegen - Gerar testes automaticamente:

```bash
npx playwright codegen http://localhost:3001
```

## 📝 Escrevendo Novos Testes

### Estrutura Básica

```typescript
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.helper';

test.describe('Minha Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page);
  });

  test('deve fazer algo', async ({ page }) => {
    // Arrange
    await page.goto('/minha-pagina');

    // Act
    await page.getByRole('button', { name: /clique/i }).click();

    // Assert
    await expect(page.getByText(/sucesso/i)).toBeVisible();
  });
});
```

### Boas Práticas

1. **Use seletores semânticos**:
   - ✅ `getByRole('button', { name: /login/i })`
   - ❌ `locator('.btn-login')`

2. **Aguarde elementos**:
   - Use `waitForLoadState('networkidle')`
   - Use `waitForTimeout()` com moderação

3. **Isole testes**:
   - Cada teste deve ser independente
   - Use `beforeEach` para setup

4. **Nomes descritivos**:
   - `test('deve permitir login com credenciais válidas')`
   - Não: `test('test1')`

5. **Use helpers**:
   - Reutilize código comum
   - Crie helpers para operações repetitivas

## 🔄 CI/CD

### GitHub Actions

Exemplo de workflow:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## 🤝 Contribuindo

Ao adicionar novos testes:
1. Siga a estrutura existente
2. Use helpers quando possível
3. Adicione comentários explicativos
4. Execute todos os testes antes de commitar
5. Atualize este README se necessário

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o backend está rodando
2. Verifique se o frontend está rodando
3. Limpe o cache: `npx playwright cache clear`
4. Reinstale navegadores: `npx playwright install --with-deps`
