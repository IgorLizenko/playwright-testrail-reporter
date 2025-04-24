/**
 * Formats the current date and time in UTC using the format YYYY/MM/DD HH:mm:ss UTC
 * @returns {string} Formatted date string
 */
function formatDate(): string {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        hour12: false
    });
    const parts = formatter.formatToParts(date);
    const values = parts.reduce<Record<string, string>>((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    return `${values.year}/${values.month}/${values.day} ${values.hour}:${values.minute}:${values.second} UTC`;
}

/**
 * Template placeholders for the test run name
 */
export const TEMPLATE_DATE = '#{date}';
export const TEMPLATE_TIMESTAMP = '#{timestamp}';
export const TEMPLATE_SUITE = '#{suite}';

/**
 * Formats a test run name by replacing template placeholders with actual values
 * @param {string} template - The template string containing placeholders
 * @param {string} [suiteName] - Optional suite name to replace in the template
 * @returns {string} Formatted test run name with replaced placeholders
 */
export function formatTestRunName(template: string, suiteName?: string): string {
    let result = template;

    result = result.replaceAll(TEMPLATE_DATE, formatDate());
    result = result.replaceAll(TEMPLATE_TIMESTAMP, Date.now().toString());

    if (suiteName) {
        result = result.replaceAll(TEMPLATE_SUITE, suiteName);
    }

    return result;
}