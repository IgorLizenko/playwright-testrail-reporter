[![npm version](https://badge.fury.io/js/playwright-reporter-testrail.svg)](https://badge.fury.io/js/playwright-reporter-testrail)

# Playwright TestRail Reporter with multi project support

## Overview

A Playwright reporter that integrates with TestRail via API and supports multiple projects and test suites. This reporter automatically creates test runs and updates test results in TestRail based on your Playwright test execution.

### Features

- 🔄 Multi-project and multi-suite support
- 🏷️ Test case mapping via tags (e.g., `@101-204-3453`)
- 📊 Automatic test run creation
- 📝 Automatic test run closing when test run is interrupted or timed out
- 🔍 Comprehensive error reporting

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
- `closeRuns`: Optional, default `false`, whether to close runs on end

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

## Additional information

### API Retry Logic

The reporter will retry the API calls up to 3 times if the API call fails with a 5xx status code.

### Multiple Playwright Tests Matching One TestRail Case

If you have multiple Playwright tests that match the same TestRail case, the reporter will abide by the following rules:

1. If all Playwright tests finish with the same status, the TestRail case will be marked with that status, and the comment (and error in case of fail) will be generated from the first test that finished.
2. If any Playwright tests finish with different statuses, the reporter will prioritize the following statuses in order: passed, failed, blocked, untested.

### Test Run Closing

When a test run is interrupted or timed out, the reporter will automatically close the test run in TestRail.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
