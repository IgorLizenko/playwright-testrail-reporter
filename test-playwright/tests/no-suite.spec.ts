import { test } from '@playwright/test';

import { debugProject2case0 } from '@test-data';

test('Simple test that always passes and has one tag that does not have suite', { tag: debugProject2case0 }, async ({ page }) => {
    await page.goto('https://playwright.dev');
});