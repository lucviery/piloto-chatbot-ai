import { expect, test } from '@playwright/test';

test('user sends a message and receives the local answer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Como posso ajudar?' })).toBeVisible();

  await page.getByLabel('Digite sua mensagem').fill('Responda somente com a palavra OK, sem explicações.');
  await page.getByLabel('Enviar mensagem').click();

  await expect(page.getByText('OK', { exact: true })).toBeVisible({ timeout: 200000 });
});

