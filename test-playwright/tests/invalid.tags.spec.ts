import { test } from '@playwright/test';

test('Test with invalid tags', { tag: ['@invalid', '@test'] }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});

test('Test with no tags at all', async ({ page }) => {
    await page.goto('https://playwright.dev');
});

test('Test with tag in a correct format but not matching anything', { tag: ['@99999-9999-9999'] }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});