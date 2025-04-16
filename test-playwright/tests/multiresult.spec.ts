import { expect, test } from '@playwright/test';

import { debugProject1suite0case0, debugProject1suite0case1 } from '@test-data';

test.skip('Skipped test', { tag: debugProject1suite0case0 }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});

test('Passed test with the same tag as skipped', { tag: debugProject1suite0case0 }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});

test('Failed test with some tag', { tag: debugProject1suite0case1 }, async ({ page }) => {
    await page.goto('https://playwright.dev');
    await expect(page).toHaveTitle('WRONG TITLE');
});

test('Passed test with some tag', { tag: debugProject1suite0case1 }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});