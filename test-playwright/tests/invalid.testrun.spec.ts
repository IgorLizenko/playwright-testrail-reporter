import { test } from '@playwright/test';

import { debugProject0suite0case0, debugProject1suite0case0 } from '@test-data';

test.describe('Test suite where some test runs wont be created because all of their tests are skipped', () => {
    test('Simple test that always passes and has one tag', { tag: debugProject0suite0case0 }, async ({ page }) => {
        await page.goto('https://playwright.dev');
    });

    test.skip('Skipped test that should not result in a test run', { tag: debugProject1suite0case0 }, async ({ page }) => {
        await page.goto('https://playwright.dev');
    });
});

test.describe('Test suite where no test runs will be created because all tagged tests are skipped', () => {
    test('Simple test that always passes and has one tag', async ({ page }) => {
        await page.goto('https://playwright.dev');
    });

    test.skip('Skipped test that should not result in a test run', { tag: debugProject1suite0case0 }, async ({ page }) => {
        await page.goto('https://playwright.dev');
    });
});