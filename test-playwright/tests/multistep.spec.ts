import test, { expect } from '@playwright/test';

import { debugProject0suite2case0, debugProject0suite2case1, debugProject0suite2case2 } from '@test-data';

test('Test with several steps', { tag: [debugProject0suite2case0, debugProject0suite2case1, debugProject0suite2case2] }, async ({ page }) => {
    await test.step(`Step 1 [13951]`, async () => {
        await page.goto('https://playwright.dev');
    });

    await test.step(`Step 2 [13952]`, async () => {
        await expect(page).toHaveTitle('FAKE', { timeout: 1_000 });
    });

    await test.step(`Step 3 [13953]`, async () => {
        await page.goto('https://playwright.dev');
    });
});

test('Test with several steps but it fails between them using expect', { tag: [debugProject0suite2case0, debugProject0suite2case1, debugProject0suite2case2] }, async ({ page }) => {
    await test.step(`Step 1 [13951]`, async () => {
        await page.goto('https://playwright.dev');
    });

    await test.step(`Step 2 [13952]`, async () => {
        await page.goto('https://playwright.dev');
    });

    await expect(page).toHaveTitle('FAKE', { timeout: 1_000 });

    await test.step(`Step 3 [13953]`, async () => {
        await page.goto('https://playwright.dev');
    });
});

test('Test with several steps but it fails between them using non-expect', { tag: [debugProject0suite2case0, debugProject0suite2case1, debugProject0suite2case2] }, async ({ page }) => {
    await test.step(`Step 1 [13951]`, async () => {
        await page.goto('https://playwright.dev');
    });

    await test.step(`Step 2 [13952]`, async () => {
        await page.goto('https://playwright.dev');
    });

    await page.locator('#nonexisting').click({ timeout: 1_000 });

    await test.step(`Step 3 [13953]`, async () => {
        await page.goto('https://playwright.dev');
    });
});

test('Test with several steps and two soft errors', { tag: [debugProject0suite2case0, debugProject0suite2case1, debugProject0suite2case2] }, async ({ page }) => {
    await test.step(`Step 1 [13951]`, async () => {
        await page.goto('https://playwright.dev');
    });

    await test.step(`Step 2 [13952]`, async () => {
        await page.goto('https://playwright.dev');
        await expect.soft(page).toHaveTitle('FAKE', { timeout: 1_000 });
        await expect.soft(page).toHaveTitle('FAKE', { timeout: 1_000 });
    });

    await test.step(`Step 3 [13953]`, async () => {
        await page.goto('https://playwright.dev');
    });
});