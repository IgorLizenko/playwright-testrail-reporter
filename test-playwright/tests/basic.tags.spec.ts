import { expect, test } from '@playwright/test';

import { debugProject0suite0case0, debugProject0suite1case0, debugProject0suite1case2 } from '@test-data';

test('Simple test that always passes and has one tag', { tag: debugProject0suite0case0 }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});

test('Simple test that always fails and has one tag', { tag: debugProject0suite1case0 }, async ({ page }) => {
    await page.goto('https://playwright.dev');
    await expect(page).toHaveTitle('WRONG TITLE', { timeout: 1_000 });
});

test('Test that generates several errors', { tag: debugProject0suite1case2 }, async ({ page }) => {
    await page.goto('https://playwright.dev');
    await expect.soft(page).toHaveTitle('WRONG TITLE', { timeout: 1_000 });
    expect.soft(1).toBe(2);

    throw new Error('Test failed');
});