import { formatTestRunName } from '@reporter/utils/format-run-name';

describe('Format test run name', () => {
    it('Should output template if it does not contain placeholders', () => {
        const template = 'Test Run';
        const result = formatTestRunName(template);
        expect(result).toBe(template);
    });

    it('Should format timestamp', () => {
        const template = '${timestamp}';
        const result = formatTestRunName(template);
        expect(result).toMatch(/\d{13}/);
    });

    it('Should format date', () => {
        const template = '${date}';
        const result = formatTestRunName(template);
        expect(result).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC/);
    });
});