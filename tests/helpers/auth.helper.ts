import { Page } from '@playwright/test';

/**
 * Helper para operações de autenticação
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Realiza login no sistema
 */
export async function login(page: Page, credentials: LoginCredentials = { username: 'admin', password: 'admin123' }) {
  // Abrir modal de login
  await page.getByRole('button', { name: /login|entrar/i }).click();

  // Preencher credenciais
  await page.getByPlaceholder(/usuário|username/i).fill(credentials.username);
  await page.getByPlaceholder(/senha|password/i).fill(credentials.password);

  // Clicar em entrar
  await page.getByRole('button', { name: /entrar|login/i }).click();

  // Aguardar autenticação
  await page.waitForTimeout(2000);
}

/**
 * Realiza logout do sistema
 */
export async function logout(page: Page) {
  await page.getByRole('button', { name: /logout|sair/i }).click();
  await page.waitForTimeout(1000);
}

/**
 * Verifica se o usuário está autenticado
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  return !!token;
}

/**
 * Obtém o token de autenticação
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('access_token'));
}

/**
 * Define o token de autenticação manualmente
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate((token) => {
    localStorage.setItem('access_token', token);
  }, token);
}

/**
 * Limpa todos os dados de autenticação
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  });
}
