import winston from "winston";

const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * Custom format for development console output.
 */
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const { service, ...restMeta } = meta as Record<string, any>;

  if (message === "API Request" && restMeta.method && restMeta.route) {
    const { method, route, statusCode, responseTimeMs } = restMeta;
    
    const ESC = String.fromCharCode(27);
    let statusColor = `${ESC}[32m`; // Green
    if (statusCode >= 500) statusColor = `${ESC}[31m`; // Red
    else if (statusCode >= 400) statusColor = `${ESC}[33m`; // Yellow
    else if (statusCode >= 300) statusColor = `${ESC}[36m`; // Cyan
    
    const reset = `${ESC}[0m`;
    const methodStr = `${ESC}[1m${method}${ESC}[0m`;
    
    return `${timestamp} [${level}]: ${methodStr} ${route} ${statusColor}${statusCode}${reset} - ${responseTimeMs}ms`;
  }

  const metaStr = Object.keys(restMeta).length ? `\n${JSON.stringify(restMeta, null, 2)}` : "";
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

/**
 * Winston logger instance.
 * - Development: console with colorized output
 * - Production: JSON to combined.log and error.log files
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
  defaultMeta: { service: "studymind-api" },
  transports: [],
});

if (process.env.NODE_ENV === "production") {
  // Production: write to files
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
} else {
  // Development: colorized console output
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), devFormat),
    })
  );
}

export default logger;
