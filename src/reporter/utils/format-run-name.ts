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

export function formatTestRunName(template: string, suiteName?: string): string {
    let result = template;

    result = result.replaceAll('${date}', formatDate());
    result = result.replaceAll('${timestamp}', Date.now().toString());

    if (suiteName) {
        result = result.replaceAll('${suite}', suiteName);
    }

    return result;
}