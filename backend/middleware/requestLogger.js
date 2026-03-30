const morgan = require('morgan');
const logger = require('./logger');

// ── Morgan HTTP access log → winston ──────────────────────────────────────────

const morganStream = {
  write: (message) => logger.info(message.trim(), { category: 'HTTP' }),
};

// Compact format: method, url, status, response-time, content-length
const httpLogger = morgan(
  ':method :url :status :res[content-length] bytes - :response-time ms - :remote-addr',
  { stream: morganStream }
);

// ── Suspicious traffic detector ───────────────────────────────────────────────

// Track 4xx counts per IP within a rolling window to detect scanners / brute-force
const ip4xxCounts = new Map();   // ip → { count, windowStart }
const WINDOW_MS   = 60 * 1000;  // 1-minute window
const ALERT_THRESHOLD = 20;      // alert after 20 client errors in the window

const suspiciousTrafficDetector = (req, res, next) => {
  // Flag oversized request bodies (Content-Length header check before body parse)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 1 * 1024 * 1024) {  // > 1 MB
    logger.security('Oversized request body detected', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      contentLength,
    });
  }

  // Intercept response to count 4xx per IP
  const originalEnd = res.end.bind(res);
  res.end = (...args) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      const ip = req.ip;
      const now = Date.now();
      const entry = ip4xxCounts.get(ip) || { count: 0, windowStart: now };

      if (now - entry.windowStart > WINDOW_MS) {
        entry.count = 1;
        entry.windowStart = now;
      } else {
        entry.count += 1;
      }
      ip4xxCounts.set(ip, entry);

      if (entry.count === ALERT_THRESHOLD) {
        logger.security('High 4xx rate detected — possible scanner or brute-force', {
          ip,
          count: entry.count,
          windowMs: WINDOW_MS,
        });
      }

      // Log every 403 individually as a potential IDOR / privilege escalation attempt
      if (res.statusCode === 403) {
        logger.security('Forbidden access attempt', {
          ip,
          method: req.method,
          path: req.path,
          userId: req.user?.id,
          userRole: req.user?.role,
        });
      }
    }
    return originalEnd(...args);
  };

  next();
};

// ── 404 handler for unknown routes ────────────────────────────────────────────

const unknownRouteLogger = (req, res, next) => {
  logger.security('Request to unknown route', {
    ip: req.ip,
    method: req.method,
    path: req.path,
  });
  res.status(404).json({ error: 'Not found' });
};

module.exports = { httpLogger, suspiciousTrafficDetector, unknownRouteLogger };
