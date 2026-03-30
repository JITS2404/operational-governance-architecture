const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const isProd = process.env.NODE_ENV === 'production';

// ── Formats ───────────────────────────────────────────────────────────────────

const jsonFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}] ${message}${extra}`;
  })
);

// ── Transports ────────────────────────────────────────────────────────────────

const logTransports = [
  new transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    format: jsonFormat,
    maxsize: 10 * 1024 * 1024,   // 10 MB
    maxFiles: 14,
    tailable: true,
  }),
  new transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    format: jsonFormat,
    maxsize: 20 * 1024 * 1024,   // 20 MB
    maxFiles: 14,
    tailable: true,
  }),
  new transports.File({
    filename: path.join(LOG_DIR, 'security.log'),
    level: 'warn',
    format: jsonFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 30,
    tailable: true,
  }),
];

if (!isProd) {
  logTransports.push(new transports.Console({ format: devFormat }));
} else {
  // In production also log errors to console so container stdout captures them
  logTransports.push(new transports.Console({
    level: 'error',
    format: jsonFormat,
  }));
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  transports: logTransports,
  exitOnError: false,
});

// ── Typed helpers ─────────────────────────────────────────────────────────────

/**
 * Log an authentication event (login success/failure, token issues).
 * Always written at warn level on failure so it lands in security.log.
 */
logger.auth = (event, meta = {}) => {
  const level = meta.success === false ? 'warn' : 'info';
  logger.log(level, event, { category: 'AUTH', ...meta });
};

/**
 * Log a security-relevant event (rate-limit hit, IDOR attempt, forbidden access).
 * Always written at warn level so it lands in security.log.
 */
logger.security = (event, meta = {}) => {
  logger.warn(event, { category: 'SECURITY', ...meta });
};

/**
 * Log an API error with request context.
 */
logger.apiError = (event, meta = {}) => {
  logger.error(event, { category: 'API_ERROR', ...meta });
};

module.exports = logger;
