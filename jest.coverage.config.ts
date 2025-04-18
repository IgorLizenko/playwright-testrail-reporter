// eslint-disable-next-line no-restricted-imports
import baseConfig from './jest.config';

const config = {
    ...baseConfig,
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    }
};

export default config;