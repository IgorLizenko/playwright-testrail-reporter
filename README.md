[![npm version](https://badge.fury.io/js/playwright-reporter-testrail.svg)](https://badge.fury.io/js/playwright-reporter-testrail)

# Playwright TestRail Reporter with Multi-Project Support

A Playwright reporter that integrates with TestRail via API and supports multiple projects and test suites.  

This reporter automatically creates test runs and updates test results in TestRail based on your Playwright test execution.

### Key Features

- 🔄 Multi-project and multi-suite support
- 🏷️ Test case mapping via tags
- 🪜 Tagged test steps support
- 📊 Automatic test run creation and updating
- 🔍 Comprehensive error reporting
- 📝 Automatic run closing (optional)
- 🖼️ Attachment support (optional)

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
      closeRuns: false,
      apiChunkSize: 10,
      runNameTemplate: 'Playwright Run #{date}'
    }]
  ]
};

export default config;
```

#### Options

- `domain`: TestRail domain URL
- `username`: TestRail email
- `password`: TestRail password or API key
- `includeAllCases`: Optional, default `false`, whether to include all cases of the suite to the test run
- `includeAttachments`: Optional, default `false`, whether to include attachments in the test run  
**❗ Important**: may result in longer execution time.
- `closeRuns`: Optional, default `false`, whether to close test runs in the end  
**❗ Important**: ensure that user has permissions to close runs in TestRail
- `apiChunkSize`: Optional, default `10`, the number of requests to send in parallel to TestRail API
- `runNameTemplate`: Optional, default `Playwright Run #{date}`, the template for the run name

#### Run Name Template Options
- `#{date}`: The current date and time in `YYYY/MM/DD HH:MM:SS UTC` format (e.g. `2025/04/22 14:27:58 UTC`)
- `#{timestamp}`: The current timestamp (e.g. `1745392678000`)
- `#{suite}`: Test suite name  
**❗ Important**: `#{suite}` requires an additional API call to TestRail for each test run, which may result in longer execution time


## Usage

### Tagging Tests

Tag your tests with TestRail case IDs using the following format:
- `@<project_id>-<suite_id>-<case_id>`

Where:
- `project_id`: TestRail project ID
- `suite_id`: TestRail test suite ID
- `case_id`: TestRail test case ID (might include prefix)

Example:

```typescript
import { test } from '@playwright/test';

test('simple test matching one case', { tag: ['@101-204-R3453'] }, async ({ page }) => {
  // Your test code
});

// Multiple test cases
test('complex feature with multiple cases from multiple projects', { tag: ['@101-204-3453', '@203-305-4567'] }, async ({ page }) => {
  // Your test code
});
```

### Tagging Test Steps

Tagging test steps is optional, but is recommended for long E2E tests.

Tag your test step titles with TestRail case ID (might include prefix) with `@`. Test step might contain multiple case IDs.

Example
```typescript
import { test } from '@playwright/test';

test('simple test matching three cases', { tag: ['@101-204-555', '@101-204-556', '@101-204-557'] }, async ({ page }) => {
  await test.step('Step 1 @555', async () => {
    // Your step code
  });

  await test.step('Step 2 @556 @R557', async () => {
    // Your step code
  });
});
```

#### Rules Regarding Tagged Steps

The main benefit of using tagged steps is for longer E2E tests to correctly mark passed steps in TestRail if the test fails on a later stage in Playwright.

- If a test contains some valid tags, tagged steps should use the same case IDs. Otherwise, the reporter will log an error and ignore those steps
- If a step does not contain a valid TestRail case ID, it will be ignored by reporter
- If a step contains a valid TestRail case ID and it passes, the corresponding TestRail case will be marked as passed regardless of the result of the whole test execution
- If a step contains a valid TestRail case ID and it fails, the corresponding TestRail case will get the same status and comment as if steps was not tagged

Avoid situation where all test tags are matched to test steps, but some steps are not tagged. If such situation occurs and the test fails, the reporter might miss the failed step and mark the test as passed in TestRail. Consider either adding tags to all steps or make sure that some tags are not matched to test steps.

#### ❌ Incorrect usage:

```typescript
import { test } from '@playwright/test';

test('simple test matching one case', { tag: ['@101-204-555'] }, async ({ page }) => {
  await test.step('Step 1 @555', async () => {
    // This step will be marked as passed in TestRail
  });

  await test.step('Step 2', async () => {
    throw new Error('TestRail will not know about this failure')
  });
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

## Additional Information

#### Graceful Failure Logic

The reporter logs errors to the console if it is not configured correctly or if any API calls fail. It does not throw errors and allows test execution to continue.

#### Creating and Updating Test Runs

TestRail test runs are created after all tests finish their execution. If Playwright run results in a timeout or interrupted statuses, test runs are not created.

#### API Retry Logic

The reporter will retry the API calls up to 3 times if the API call fails with a 5xx status code.

#### Multiple Playwright Tests Matching One TestRail Case

If you have multiple Playwright tests that match the same TestRail case, the reporter will abide by the following rules:

1. If all Playwright tests finish with the same status, the TestRail case will be marked with that status, and the comment (and error in case of fail) will be generated from the first test that finished.
2. If any Playwright tests finish with different statuses, the reporter will prioritize the following statuses in order: passed, failed, blocked, untested.

#### Known Issues

When several Playwright tests match the same TestRail case, each test will upload its attachments to the TestRail case. This may result in duplicate attachments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
