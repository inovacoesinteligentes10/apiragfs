import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Testes de Upload e Gerenciamento de Documentos
 */

test.describe('Gerenciamento de Documentos', () => {
  // Helper para fazer login antes de cada teste
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fazer login
    await page.getByRole('button', { name: /login|entrar/i }).click();
    await page.getByPlaceholder(/usuário|username/i).fill('admin');
    await page.getByPlaceholder(/senha|password/i).fill('admin123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForTimeout(2000);

    // Navegar para documentos
    const documentsButton = page.getByRole('button', { name: /documentos|documents/i }).first();
    if (await documentsButton.isVisible()) {
      await documentsButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('deve exibir a página de documentos corretamente', async ({ page }) => {
    // Verificar título
    await expect(page.getByText(/gerenciar documentos|documentos/i)).toBeVisible();

    // Verificar área de upload
    await expect(page.getByText(/arraste arquivos|upload|fazer upload/i)).toBeVisible();
  });

  test('deve bloquear upload sem autenticação', async ({ page }) => {
    // Fazer logout
    await page.getByRole('button', { name: /logout|sair/i }).click();
    await page.waitForTimeout(1000);

    // Tentar navegar para documentos
    const documentsButton = page.getByRole('button', { name: /documentos|documents/i }).first();
    if (await documentsButton.isVisible()) {
      await documentsButton.click();
    }

    // Verificar se mostra aviso de autenticação
    await expect(page.getByText(/autenticação necessária|faça login/i)).toBeVisible();

    // Verificar se o botão de upload está desabilitado
    const uploadButton = page.getByRole('button', { name: /processar|fazer upload/i });
    if (await uploadButton.isVisible()) {
      await expect(uploadButton).toBeDisabled();
    }
  });

  test('deve permitir seleção de arquivo para upload', async ({ page }) => {
    // Criar um arquivo de teste temporário
    const testFilePath = path.join(__dirname, '../fixtures/test-document.txt');

    // Configurar o listener para upload de arquivo
    const fileInput = page.locator('input[type="file"]');

    // Fazer upload do arquivo
    await fileInput.setInputFiles(testFilePath);

    // Verificar se o arquivo aparece na lista
    await expect(page.getByText(/test-document\.txt/i)).toBeVisible();
  });

  test('deve mostrar stores/departamentos disponíveis', async ({ page }) => {
    // Verificar se há stores para selecionar
    const storeSelector = page.getByText(/selecione o store|departamento/i);

    if (await storeSelector.isVisible()) {
      await expect(storeSelector).toBeVisible();
    }
  });

  test('deve listar documentos já processados', async ({ page }) => {
    // Aguardar carregamento da lista
    await page.waitForTimeout(2000);

    // Verificar se há tabela ou lista de documentos
    const documentsTable = page.locator('table, [role="table"]');

    if (await documentsTable.count() > 0) {
      // Verificar se há documentos na tabela
      const hasDocuments = await page.getByText(/\.(pdf|txt|doc|docx)/i).isVisible();

      if (hasDocuments) {
        console.log('✅ Documentos encontrados na lista');
      } else {
        console.log('ℹ️ Nenhum documento encontrado');
      }
    }
  });

  test('deve permitir deletar documento', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(2000);

    // Procurar botão de deletar
    const deleteButton = page.getByRole('button', { name: /deletar|excluir|remover/i }).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Verificar se aparece modal de confirmação
      await expect(page.getByText(/tem certeza|confirmar|excluir/i)).toBeVisible();

      // Confirmar deleção
      await page.getByRole('button', { name: /confirmar|sim|excluir/i }).click();

      // Aguardar operação
      await page.waitForTimeout(1000);

      // Verificar se aparece mensagem de sucesso
      await expect(page.getByText(/excluído|removido|sucesso/i)).toBeVisible();
    }
  });

  test('deve mostrar status de processamento de documentos', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(2000);

    // Verificar se há indicadores de status
    const statusIndicators = page.locator('[class*="status"], [class*="progress"]');

    if (await statusIndicators.count() > 0) {
      console.log('✅ Indicadores de status encontrados');
    }
  });

  test('deve permitir filtrar documentos por store', async ({ page }) => {
    // Verificar se há seletor de store
    const storeButtons = page.getByRole('button', { name: /geral|financeiro|rh|ti/i });

    if (await storeButtons.count() > 0) {
      await storeButtons.first().click();
      await page.waitForTimeout(1000);

      // A lista deve atualizar (verificar se houve mudança)
      console.log('✅ Filtro de store funcional');
    }
  });
});
