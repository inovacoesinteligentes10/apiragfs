import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Executar testes em paralelo */
  fullyParallel: true,

  /* Falhar o build no CI se você acidentalmente deixou test.only */
  forbidOnly: !!process.env.CI,

  /* Retry em caso de falha no CI */
  retries: process.env.CI ? 2 : 0,

  /* Opt out do paralelismo no CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  /* Configurações compartilhadas para todos os projetos */
  use: {
    /* URL base para usar em ações como `await page.goto('/')` */
    baseURL: 'http://localhost:3001',

    /* Coletar trace ao falhar testes */
    trace: 'on-first-retry',

    /* Screenshot ao falhar */
    screenshot: 'only-on-failure',

    /* Video ao falhar */
    video: 'retain-on-failure',
  },

  /* Configurar projetos para diferentes navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Teste em mobile viewports */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Iniciar servidor de dev antes dos testes */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
