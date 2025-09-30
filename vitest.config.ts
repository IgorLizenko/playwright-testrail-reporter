import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        reporters: ['verbose'],
        clearMocks: true,
        coverage: {
            clean: true,
            provider: 'v8',
            include: ['src/reporter/utils/**/*', 'src/testrail-api/**/*'],
            reportsDirectory: './coverage',
            thresholds: {
                branches: 100,
                functions: 100,
                lines: 100,
                statements: 100
            }
        },
        environment: 'node',
        include: ['./unit-tests/**/*'],
        root: './'
    }
});