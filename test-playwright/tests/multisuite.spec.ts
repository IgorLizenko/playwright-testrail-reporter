import { test } from '@playwright/test';

import { debugProject0suite0case0, debugProject1suite0case0 } from '@test-data';

test('Simple test that always passes and has two tags', { tag: [debugProject0suite0case0, debugProject1suite0case0] }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});