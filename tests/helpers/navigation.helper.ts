import { Page } from '@playwright/test';

/**
 * Helper para navegação entre views
 */

export type ViewName = 'dashboard' | 'documents' | 'chat' | 'stores' | 'analytics' | 'users' | 'chats';

/**
 * Navega para uma view específica
 */
export async function navigateToView(page: Page, view: ViewName) {
  const viewButtonMap: Record<ViewName, RegExp> = {
    dashboard: /dashboard|início/i,
    documents: /documentos|documents/i,
    chat: /chat/i,
    stores: /stores|departamentos/i,
    analytics: /analytics|análises/i,
    users: /users|usuários/i,
    chats: /chats|conversas/i,
  };

  const buttonPattern = viewButtonMap[view];
  const button = page.getByRole('button', { name: buttonPattern }).first();

  if (await button.isVisible()) {
    await button.click();
    await page.waitForTimeout(1000);
  } else {
    throw new Error(`View button for "${view}" not found`);
  }
}

/**
 * Aguarda o carregamento completo da página
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/**
 * Verifica se está na view especificada
 */
export async function isOnView(page: Page, view: ViewName): Promise<boolean> {
  const viewTitleMap: Record<ViewName, RegExp> = {
    dashboard: /dashboard|bem-vindo/i,
    documents: /gerenciar documentos|documentos/i,
    chat: /chat|conversa/i,
    stores: /gerenciar stores|stores/i,
    analytics: /analytics|análises/i,
    users: /gerenciar usuários|usuários/i,
    chats: /seus chats|conversas/i,
  };

  const titlePattern = viewTitleMap[view];
  return await page.getByText(titlePattern).isVisible();
}
