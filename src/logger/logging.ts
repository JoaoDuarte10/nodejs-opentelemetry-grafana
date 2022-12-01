require('dotenv').config()
import winston, { createLogger, format } from "winston";
import LokiTransport from "winston-loki";

const { combine, timestamp, printf } = format;
const customFormat = printf(({ timestamp, level, message }) => {
    return `${timestamp} | ${level}: ${message}`;
});

const hostName = process.env.LOKI_HOST || 'loki';
const jobName = process.env.JOB_NAME;

const options = {
    format: combine(format.splat(), format.simple(), timestamp(), customFormat),
    transports: [
        new LokiTransport({
            format: winston.format.json(),
            host: `http://${hostName}:3100`,
            labels: {
                job: jobName
            },
        }),
        new winston.transports.Console({
            format: combine(
                format.colorize(),
                format.splat(),
                format.simple(),
                timestamp(),
                customFormat,
            ),
        }),
    ]
};

export const logger = createLogger(options);
