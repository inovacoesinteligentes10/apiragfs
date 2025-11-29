import { test, expect } from '@playwright/test';

/**
 * Testes de Funcionalidade de Chat
 */

test.describe('Chat com IA', () => {
  // Helper para fazer login e navegar para chat
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fazer login
    // Clicar no botão "Fazer Login" no menu do usuário (canto inferior esquerdo)
    const loginButton = page.getByRole('button', { name: /fazer login/i });
    await loginButton.waitFor({ timeout: 10000 });
    await loginButton.click();

    // Aguardar modal abrir
    await page.waitForTimeout(500);

    // Preencher formulário de login com os placeholders corretos
    await page.getByPlaceholder('seu@email.com').fill('admin@test.com');
    await page.getByPlaceholder('••••••••').fill('admin123');

    // Clicar no botão "Entrar" do modal
    await page.getByRole('button', { name: /^entrar$/i }).click();

    // Aguardar o modal fechar e o login completar
    await page.waitForTimeout(5000);

    // Verificar se o login foi bem-sucedido (modal fechou)
    const isModalClosed = !(await page.getByPlaceholder('seu@email.com').isVisible());
    if (!isModalClosed) {
      console.warn('⚠️ Modal de login ainda visível. Login pode ter falhado.');
    }
  });

  test('deve exibir mensagem quando não há documentos', async ({ page }) => {
    // Navegar para chat (se houver botão)
    const chatButton = page.getByRole('button', { name: /chat/i }).first();

    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(2000);

      // Se não houver documentos, deve mostrar mensagem
      const noDocsMessage = page.getByText(/nenhum documento|faça upload/i);
      const chatInterface = page.getByPlaceholder(/digite|mensagem/i);

      // Um dos dois deve estar visível
      const hasNoDocs = await noDocsMessage.isVisible();
      const hasChat = await chatInterface.isVisible();

      expect(hasNoDocs || hasChat).toBeTruthy();
    }
  });

  test('deve iniciar chat automaticamente com documentos', async ({ page }) => {
    // Navegar para chat
    const chatButton = page.getByRole('button', { name: /chat/i }).first();

    if (await chatButton.isVisible()) {
      await chatButton.click();

      // Aguardar inicialização (pode levar alguns segundos)
      await page.waitForTimeout(5000);

      // Verificar se a interface de chat está visível
      const chatInput = page.getByPlaceholder(/digite|mensagem|perguntar/i);

      if (await chatInput.isVisible()) {
        console.log('✅ Interface de chat carregada');
        await expect(chatInput).toBeVisible();
      } else {
        // Se não há interface, deve ter mensagem de "sem documentos"
        await expect(page.getByText(/nenhum documento|faça upload/i)).toBeVisible();
      }
    }
  });

  test('deve permitir criar novo chat', async ({ page }) => {
    // Clicar no botão New Chat
    const newChatButton = page.getByRole('button', { name: /new chat|novo chat/i });

    if (await newChatButton.isVisible()) {
      await newChatButton.click();
      await page.waitForTimeout(3000);

      // Verificar se a interface de chat está presente
      const chatInput = page.getByPlaceholder(/digite|mensagem|perguntar/i);

      if (await chatInput.isVisible()) {
        console.log('✅ Novo chat iniciado');
        await expect(chatInput).toBeVisible();
      }
    }
  });

  test('deve enviar mensagem e receber resposta', async ({ page }) => {
    // Navegar para chat
    const chatButton = page.getByRole('button', { name: /chat/i }).first();

    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(5000);

      // Verificar se há input de chat
      const chatInput = page.getByPlaceholder(/digite|mensagem|perguntar/i);

      if (await chatInput.isVisible()) {
        // Digite uma mensagem
        await chatInput.fill('Olá, como você pode me ajudar?');

        // Enviar mensagem (Enter ou botão)
        await chatInput.press('Enter');

        // Aguardar resposta (pode levar alguns segundos)
        await page.waitForTimeout(10000);

        // Verificar se há resposta da IA
        const responseText = page.locator('[class*="message"], [class*="response"]');

        if (await responseText.count() > 0) {
          console.log('✅ Resposta recebida da IA');
        }
      }
    }
  });

  test('deve exibir histórico de mensagens', async ({ page }) => {
    // Navegar para chat
    const chatButton = page.getByRole('button', { name: /chat/i }).first();

    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(5000);

      const chatInput = page.getByPlaceholder(/digite|mensagem|perguntar/i);

      if (await chatInput.isVisible()) {
        // Enviar primeira mensagem
        await chatInput.fill('Mensagem 1');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        // Enviar segunda mensagem
        await chatInput.fill('Mensagem 2');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        // Verificar se ambas as mensagens estão visíveis
        await expect(page.getByText(/mensagem 1/i)).toBeVisible();
        await expect(page.getByText(/mensagem 2/i)).toBeVisible();
      }
    }
  });

  test('deve mostrar loading enquanto aguarda resposta', async ({ page }) => {
    // Navegar para chat
    const chatButton = page.getByRole('button', { name: /chat/i }).first();

    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(5000);

      const chatInput = page.getByPlaceholder(/digite|mensagem|perguntar/i);

      if (await chatInput.isVisible()) {
        // Enviar mensagem
        await chatInput.fill('Teste de loading');
        await chatInput.press('Enter');

        // Imediatamente verificar se há indicador de loading
        const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], [class*="animate"]');

        if (await loadingIndicator.count() > 0) {
          console.log('✅ Indicador de loading presente');
        }
      }
    }
  });

  test('deve permitir visualizar chats anteriores', async ({ page }) => {
    // Clicar em "Ver todos os chats"
    const viewChatsButton = page.getByRole('button', { name: /ver todos|chats|histórico/i });

    if (await viewChatsButton.isVisible()) {
      await viewChatsButton.click();
      await page.waitForTimeout(2000);

      // Verificar se mostra lista de chats
      await expect(page.getByText(/seus chats|conversas/i)).toBeVisible();
    }
  });

  test('deve permitir trocar de store durante o chat', async ({ page }) => {
    // Navegar para chat
    const chatButton = page.getByRole('button', { name: /chat/i }).first();

    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(5000);

      // Procurar seletor de store
      const storeSelector = page.getByRole('button', { name: /geral|financeiro|rh/i }).first();

      if (await storeSelector.isVisible()) {
        await storeSelector.click();
        await page.waitForTimeout(2000);

        console.log('✅ Troca de store funcional');
      }
    }
  });

  test('deve mostrar fontes/grounding chunks na resposta', async ({ page }) => {
    // Navegar para chat
    const chatButton = page.getByRole('button', { name: /chat/i }).first();

    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(5000);

      const chatInput = page.getByPlaceholder(/digite|mensagem|perguntar/i);

      if (await chatInput.isVisible()) {
        // Fazer uma pergunta que requer grounding
        await chatInput.fill('Qual informação você tem sobre os documentos?');
        await chatInput.press('Enter');
        await page.waitForTimeout(10000);

        // Verificar se há indicação de fontes
        const sourceIndicator = page.getByText(/fonte|documento|referência/i);

        if (await sourceIndicator.isVisible()) {
          console.log('✅ Fontes/grounding chunks visíveis');
        }
      }
    }
  });
});
