# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Playwright reporter that integrates with TestRail via API, supporting multiple projects and test suites. The reporter automatically creates test runs and updates test results in TestRail based on Playwright test execution. It supports both projects with test suites (format: `@projectId-suiteId-caseId`) and single repository structure projects (format: `@projectId-caseId`).

## Common Commands

### Build
```bash
npm run build
```
Compiles TypeScript to JavaScript in the `lib/` directory and resolves path aliases using tsc-alias.

### Testing
```bash
# Run unit tests with Vitest
vitest run

# Run unit tests with coverage (requires 100% coverage)
npm run test:coverage

# Pre-commit test run (no coverage)
npm run test:pre-commit

# Integration tests with Playwright
npm run playwright-all          # Run all Playwright integration tests
npm run playwright-basic        # Run basic tags test
npm run playwright-no-tags      # Run invalid tags test
npm run playwright-multiresult  # Run multiple results test
npm run playwright-multisuite   # Run multiple suite test
```

### Linting
```bash
npx eslint .
```
The project uses strict TypeScript ESLint rules, including complexity checks and stylistic rules.

## Architecture

### Core Components

**Reporter Flow** (`src/reporter/reporter.ts`):
1. `onBegin()`: Parses all test tags and creates internal data structure of runs to create
2. `onTestEnd()`: Collects test results and attachments as tests complete
3. `onEnd()`: Creates TestRail runs, uploads results and attachments, optionally closes runs

**TestRail API Client** (`src/testrail-api/testrail-api.ts`):
- Wraps TestRail API v2 with axios
- Implements automatic retry logic (3 retries) for 5xx errors and network failures
- Handles suite info, run creation, result updates, attachments, and run closing

**Tag Parsing** (`src/reporter/utils/tags.ts`):
- `REGEX_TAG_TEST`: Matches `@projectId-suiteId-RcaseId` format (R is optional prefix)
- `REGEX_TAG_TEST_SUITELESS`: Matches `@projectId-RcaseId` format for single repository projects
- `REGEX_TAG_STEP`: Matches `@RcaseId` in test step titles
- Tags are parsed from Playwright test metadata and grouped by project/suite combination

### Data Flow

1. **Tag Collection**: All test tags are collected in `onBegin()` and parsed into `ProjectSuiteCombo` objects
2. **Result Collection**: Test results are accumulated in `arrayTestResults` as tests complete
3. **Run Creation**: After all tests complete, runs are created in TestRail using chunked parallel requests
4. **Result Mapping**: Test results are mapped to created runs based on project/suite/case IDs
5. **Updates**: Results are uploaded to TestRail in parallel chunks (default: 10 concurrent requests)
6. **Attachments** (optional): Files are uploaded individually to matching result IDs
7. **Closing** (optional): Runs are closed if `closeRuns` option is enabled

### Key Data Structures

- **`ProjectSuiteCombo`**: Groups case IDs by project and suite (represents a TestRail run to create)
- **`ParsedTag`**: Individual tag parsed into projectId, suiteId (nullable), and caseId
- **`RunCreated`**: Maps created TestRail run ID back to the project/suite/cases
- **`FinalResult`**: Contains run ID and array of case results ready to upload

### Path Aliases

The project uses TypeScript path aliases (configured in `tsconfig.json`):
- `@types-internal/*` → `src/types/*`
- `@testrail-api/*` → `src/testrail-api/*`
- `@reporter/*` → `src/reporter/*`
- `@logger` → `src/utils/logger.ts`
- `@utils/*` → `src/utils/*`
- `@test-data` → `test-playwright/test-data.ts`

Path aliases are resolved at build time using `tsc-alias`.

### Test Structure

- **Unit tests** (`unit-tests/`): Vitest tests for utility functions and API client logic
  - Coverage requirement: 100% for `src/reporter/utils/**/*` and `src/testrail-api/**/*`
  - Tests use mocked axios adapter for API testing
- **Integration tests** (`test-playwright/`): Playwright tests that exercise the reporter end-to-end
  - Requires `.env` file with real TestRail credentials
  - Tests various tag formats, multi-suite scenarios, and edge cases

### Important Implementation Details

- **Tagged Steps**: Optional feature where test steps can be tagged with case IDs. If a step passes but the test fails later, that specific case is marked as passed in TestRail.
- **Empty Runs**: By default, runs where all tests are skipped are not created. Set `createEmptyRuns: true` to override.
- **Multiple Tests → One Case**: If multiple Playwright tests match the same TestRail case, status priority is: passed > failed > blocked > untested.
- **Graceful Failures**: The reporter logs errors but never throws, allowing test execution to continue even if TestRail integration fails.
- **Chunked API Calls**: API calls are made in parallel chunks (configurable via `apiChunkSize`) to improve performance while respecting rate limits.

## Development Workflow

1. Make code changes in `src/`
2. Run unit tests with coverage: `npm run test:coverage`
3. Build the package: `npm run build`
4. Run integration tests if needed: `npm run playwright-all` (requires TestRail credentials in `.env`)
5. Lint: `npx eslint .`

The project uses Husky pre-commit hooks to run tests before commits.
