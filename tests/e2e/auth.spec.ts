import { test, expect } from '@playwright/test';

/**
 * Testes de Autenticação
 * Testa login, logout e controle de acesso
 */

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir a página inicial sem erro', async ({ page }) => {
    // Verificar se o título está presente
    await expect(page.getByText(/APIRagFST|Sistema/i)).toBeVisible();
  });

  test('deve mostrar modal de login ao clicar no menu do usuário', async ({ page }) => {
    // Clicar no UserMenu (canto inferior esquerdo)
    await page.getByRole('button', { name: /login|entrar/i }).click();

    // Verificar se o modal de login aparece
    await expect(page.getByText(/fazer login|entrar/i)).toBeVisible();
    await expect(page.getByPlaceholder(/usuário|username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/senha|password/i)).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Abrir modal de login
    await page.getByRole('button', { name: /login|entrar/i }).click();

    // Preencher credenciais
    await page.getByPlaceholder(/usuário|username/i).fill('admin');
    await page.getByPlaceholder(/senha|password/i).fill('admin123');

    // Clicar em entrar
    await page.getByRole('button', { name: /entrar|login/i }).click();

    // Esperar pela autenticação
    await page.waitForTimeout(2000);

    // Verificar se o login foi bem-sucedido
    // O modal deve fechar e o nome do usuário deve aparecer
    await expect(page.getByText(/admin/i)).toBeVisible();

    // Verificar se o token foi salvo no localStorage
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Abrir modal de login
    await page.getByRole('button', { name: /login|entrar/i }).click();

    // Preencher credenciais inválidas
    await page.getByPlaceholder(/usuário|username/i).fill('usuario_invalido');
    await page.getByPlaceholder(/senha|password/i).fill('senha_errada');

    // Clicar em entrar
    await page.getByRole('button', { name: /entrar|login/i }).click();

    // Esperar pela resposta
    await page.waitForTimeout(1000);

    // Verificar se aparece mensagem de erro
    await expect(page.getByText(/credenciais inválidas|erro|falha/i)).toBeVisible();
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    // Primeiro fazer login
    await page.getByRole('button', { name: /login|entrar/i }).click();
    await page.getByPlaceholder(/usuário|username/i).fill('admin');
    await page.getByPlaceholder(/senha|password/i).fill('admin123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForTimeout(2000);

    // Fazer logout
    await page.getByRole('button', { name: /logout|sair/i }).click();

    // Verificar se o token foi removido
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeFalsy();

    // Verificar se voltou ao estado não autenticado
    await expect(page.getByRole('button', { name: /login|entrar/i })).toBeVisible();
  });

  test('deve bloquear acesso a funcionalidades sem login', async ({ page }) => {
    // Tentar acessar a view de documentos
    // O sistema deve mostrar mensagem de autenticação necessária

    // Navegar para documentos (se houver link/botão)
    const documentsLink = page.getByRole('button', { name: /documentos|documents/i });
    if (await documentsLink.isVisible()) {
      await documentsLink.click();

      // Verificar se mostra aviso de autenticação
      await expect(page.getByText(/autenticação necessária|faça login/i)).toBeVisible();
    }
  });
});
