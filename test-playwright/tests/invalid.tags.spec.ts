import { test } from '@playwright/test';

test('Test with invalid tags', { tag: ['@invalid', '@test'] }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});

test('Test with no tags at all', async ({ page }) => {
    await page.goto('https://playwright.dev');
});