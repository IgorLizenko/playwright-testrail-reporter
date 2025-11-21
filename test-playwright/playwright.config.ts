import path from 'path';

import { defineConfig, devices } from '@playwright/test';
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    testMatch: '*.spec.ts',
    reporter: [
        ['../src/index.ts', {
            domain: process.env.TESTRAIL_URL,
            username: process.env.TESTRAIL_USERNAME,
            password: process.env.TESTRAIL_PASSWORD,
            includeAllCases: false,
            includeAttachments: true,
            closeRuns: true,
            createEmptyRuns: false,
            runNameTemplate: '#{suite} Run #{date}'
        }],
        ['html', { open: 'never' }]
    ],
    use: {
        trace: 'on-first-retry',
        screenshot: {
            mode: 'on',
            fullPage: true
        }
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});