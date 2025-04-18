[![npm version](https://badge.fury.io/js/playwright-reporter-testrail.svg)](https://badge.fury.io/js/playwright-reporter-testrail)

# Playwright TestRail Reporter with multi project support

## Overview

A Playwright reporter that integrates with TestRail via API and supports multiple projects and test suites. This reporter automatically creates test runs and updates test results in TestRail based on your Playwright test execution.

### Features

- 🔄 Multi-project and multi-suite support
- 🏷️ Test case mapping via tags (e.g., `@101-204-3453`)
- 📊 Automatic test run creation
- 📝 On demand run closing
- 🔍 Comprehensive error reporting (includes attachments on demand)

## Setup

### Installation

```bash
npm install --save-dev playwright-reporter-testrail
```

### Playwright Setup

1. Get your TestRail credentials:
   - Domain (e.g., `https://yourdomain.testrail.io`)
   - Email
   - Password or API Key

2. Configure the reporter in your `playwright.config.ts`:

```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  reporter: [
    ['playwright-reporter-testrail', {
      domain: 'https://yourdomain.testrail.io',
      username: 'your-email',
      password: 'your-password',
      includeAllCases: false,
      includeAttachments: false,
      closeRuns: false
    }]
  ]
};

export default config;
```

#### Options

- `domain`: TestRail domain (e.g., `https://yourdomain.testrail.io`)
- `username`: TestRail email
- `password`: TestRail password or API key
- `includeAllCases`: Optional, default `false`, whether to include all cases of the suite to the test run
- `includeAttachments`**![Beta](https://img.shields.io/badge/status-beta-red)**: Optional, default `false`, whether to include attachments in the test run.  
**Important**: may result in longer execution time
- `closeRuns`: Optional, default `false`, whether to close test runs in the end.  
**Important**: ensure that user has permissions to close runs in TestRail.

## Usage

### Tagging Tests

Tag your tests with TestRail case IDs using the following format:
- `@<project_id>-<suite_id>-<case_id>`

Where:
- `project_id`: TestRail project ID
- `suite_id`: TestRail test suite ID
- `case_id`: TestRail test case ID

Example:

```typescript
import { test } from '@playwright/test';

test('simple test matching one case', { tag: ['@101-204-3453'] }, async ({ page }) => {
  // Your test code
});

// Multiple test cases
test('complex feature with multiple cases from multiple projects', { tag: ['@101-204-3453', '@203-305-4567'] }, async ({ page }) => {
  // Your test code
});
```

### Running Tests

Run your Playwright tests as usual:

```bash
npx playwright test
```

Your test results will be automatically sent to TestRail.

### Logging

If you want to have more detailed logs, consider setting `TESTRAIL_REPORTER_DEBUG_MODE` environment variable to `true`.

## Additional information

### Creating and Updating Test Runs

TestRail test runs are created after all tests finish their execution. If Playwright run results in a timeout or interrupted statuses, test runs are not created.

### API Retry Logic

The reporter will retry the API calls up to 3 times if the API call fails with a 5xx status code.

### Multiple Playwright Tests Matching One TestRail Case

If you have multiple Playwright tests that match the same TestRail case, the reporter will abide by the following rules:

1. If all Playwright tests finish with the same status, the TestRail case will be marked with that status, and the comment (and error in case of fail) will be generated from the first test that finished.
2. If any Playwright tests finish with different statuses, the reporter will prioritize the following statuses in order: passed, failed, blocked, untested.

### Know Issues

When several Playwright tests match the same TestRail case, each test will upload its attachments to the TestRail case. This may result in duplicate attachments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
