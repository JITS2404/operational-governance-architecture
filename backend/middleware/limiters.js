const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// ── Shared handler ────────────────────────────────────────────────────────────
// express-rate-limit v7 passes (req, res, next, options) to the handler.
// We log the event and return a consistent 429 with Retry-After.

const rateLimitHandler = (req, res, _next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  logger.security('Rate limit exceeded', {
    ip: req.ip,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    limiter: options.name || 'unknown',
    retryAfterSeconds: retryAfter,
  });
  res.set('Retry-After', String(retryAfter));
  res.status(429).json({
    error: 'Too many requests. Please slow down.',
    retryAfter,
  });
};

// ── Key generators ────────────────────────────────────────────────────────────

// For unauthenticated routes: key by IP only.
const ipKey = (req) => req.ip;

// For authenticated routes: key by user ID so one user can't exhaust another's
// quota, and so NAT/shared-IP users don't interfere with each other.
// Falls back to IP if the token hasn't been verified yet (shouldn't happen on
// authenticated routes, but is safe).
const userKey = (req) => req.user?.id || req.ip;

// ── Bot / headless-browser detection ─────────────────────────────────────────
// Runs before rate limiters. Rejects requests with no User-Agent or a known
// automation UA. Legitimate browsers and mobile apps always send a UA.

const BLOCKED_UA_PATTERNS = [
  /python-requests/i,
  /go-http-client/i,
  /java\/\d/i,
  /curl\//i,
  /wget\//i,
  /scrapy/i,
  /httpie/i,
  /axios\/0\.[0-9]\./i,   // very old axios versions used by scrapers
  /bot(?!tle)/i,           // matches "bot" but not "bottle"
  /crawler/i,
  /spider/i,
  /headlesschrome/i,
  /phantomjs/i,
];

const botDetection = (req, res, next) => {
  const ua = req.headers['user-agent'] || '';

  if (!ua) {
    logger.security('Request with no User-Agent blocked', { ip: req.ip, method: req.method, path: req.path });
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua))) {
    logger.security('Automated client blocked by User-Agent', { ip: req.ip, ua, method: req.method, path: req.path });
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

// ── Limiters ──────────────────────────────────────────────────────────────────

/**
 * General API limiter — applied to all /api/ routes.
 * Keyed by IP. Generous window to cover normal browsing.
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),  // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  keyGenerator: ipKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  name: 'general',
});

/**
 * Auth limiter — login and token refresh.
 * Tight window, keyed by IP to stop credential stuffing from one machine.
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_WINDOW_MS || '900000', 10),   // 15 min
  max:      parseInt(process.env.AUTH_RATE_MAX || '10', 10),
  keyGenerator: ipKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  name: 'auth',
});

/**
 * Account creation limiter — POST /api/users.
 * Keyed by IP. Even though this route requires PLATFORM_ADMIN, an attacker
 * who steals an admin token should not be able to bulk-create accounts.
 */
const accountCreationLimiter = rateLimit({
  windowMs: parseInt(process.env.ACCOUNT_CREATE_WINDOW_MS || '3600000', 10),  // 1 hour
  max:      parseInt(process.env.ACCOUNT_CREATE_MAX || '20', 10),
  keyGenerator: ipKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  name: 'account-creation',
});

/**
 * Ticket creation limiter — POST /api/tickets.
 * Keyed by authenticated user ID to prevent one user from flooding the system.
 */
const ticketCreationLimiter = rateLimit({
  windowMs: parseInt(process.env.TICKET_CREATE_WINDOW_MS || '3600000', 10),  // 1 hour
  max:      parseInt(process.env.TICKET_CREATE_MAX || '30', 10),
  keyGenerator: userKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  name: 'ticket-creation',
});

/**
 * Write mutation limiter — PUT / DELETE on tickets, users, categories, locations.
 * Keyed by user ID. Prevents automated bulk-update or bulk-delete scripts.
 */
const writeMutationLimiter = rateLimit({
  windowMs: parseInt(process.env.WRITE_RATE_WINDOW_MS || '60000', 10),   // 1 min
  max:      parseInt(process.env.WRITE_RATE_MAX || '30', 10),
  keyGenerator: userKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  name: 'write-mutation',
});

/**
 * AI / generation limiter — any /api/ai/* route.
 * Keyed by user ID. AI calls are expensive; tight per-user cap.
 */
const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_WINDOW_MS || '60000', 10),      // 1 min
  max:      parseInt(process.env.AI_RATE_MAX || '5', 10),
  keyGenerator: userKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  name: 'ai-generation',
});

/**
 * Read / list limiter — GET on collections (tickets list, users list, etc.).
 * Keyed by user ID to prevent scraping all records page by page.
 */
const readLimiter = rateLimit({
  windowMs: parseInt(process.env.READ_RATE_WINDOW_MS || '60000', 10),    // 1 min
  max:      parseInt(process.env.READ_RATE_MAX || '60', 10),
  keyGenerator: userKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  name: 'read',
});

module.exports = {
  botDetection,
  generalLimiter,
  authLimiter,
  accountCreationLimiter,
  ticketCreationLimiter,
  writeMutationLimiter,
  aiLimiter,
  readLimiter,
};
