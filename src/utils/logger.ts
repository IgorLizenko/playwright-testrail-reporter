import chalk from 'chalk';
import winston from 'winston';

winston.addColors({
    info: 'blue',
    warn: 'yellow',
    error: 'red',
    debug: 'green'
});

const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let formattedMessage = `${chalk.magenta(`[TestRail Reporter]`)} ${chalk.grey(timestamp)} [${level}] : ${message}`;

    const arrayExtraArguments = metadata[Symbol.for('splat')] as unknown[] | undefined;
    if (arrayExtraArguments?.length) {
        const formattedArgs = arrayExtraArguments.map((arg) => {
            if (arg === null) { return 'null'; }
            if (arg === undefined) { return 'undefined'; }
            return typeof arg === 'object'
                ? JSON.stringify(arg, null, 2)
                : String(arg);
        });

        if (formattedArgs.length > 0) {
            formattedMessage = `${formattedMessage} ${formattedArgs.join(chalk.yellow(' | '))}`;
        }
    }

    return formattedMessage;
});

const logger = winston.createLogger({
    level: process.env.TESTRAIL_REPORTER_DEBUG_MODE === 'true' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.colorize({ level: true }),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        logFormat
    ),
    transports: [new winston.transports.Console()]
});

export default logger;