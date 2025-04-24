import { formatTestRunName } from '@reporter/utils/format-run-name';

describe('Format test run name', () => {
    it('Should output template if it does not contain placeholders', () => {
        const template = 'Test Run';
        const result = formatTestRunName(template);
        expect(result).toBe(template);
    });

    it('Should format timestamp', () => {
        const template = '#{timestamp}';
        const result = formatTestRunName(template);
        expect(result).toMatch(/\d{13}/);
    });

    it('Should format date', () => {
        const template = '#{date}';
        const result = formatTestRunName(template);
        expect(result).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC/);
    });

    it('Should not format suite name if it is not provided', () => {
        const template = '#{suite}';
        const result = formatTestRunName(template);
        expect(result).toBe(template);
    });

    it('Should format suite name', () => {
        const template = '#{suite}';
        const suiteName = 'Suite Name';
        const result = formatTestRunName(template, suiteName);
        expect(result).toBe(suiteName);
    });

    it('Should format timestamp, date, suite name and some additional string', () => {
        const template = '#{timestamp} #{date} #{suite} Additional String';
        const suiteName = 'Suite Name';
        const result = formatTestRunName(template, suiteName);
        expect(result).toMatch(/\d{13} \d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC Suite Name Additional String/);
    });
});