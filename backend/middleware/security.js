const helmet = require('helmet');

/**
 * Apply all security-related Express middleware.
 * Must be called before routes are registered.
 */
const applySecurityMiddleware = (app) => {
  // Trust the first proxy hop so req.ip and x-forwarded-proto are accurate
  // behind AWS ALB / nginx / Heroku. Set to the number of proxy hops in prod.
  const trustProxy = parseInt(process.env.TRUST_PROXY || '0', 10);
  if (trustProxy > 0) app.set('trust proxy', trustProxy);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        scriptSrc:   ["'self'"],
        imgSrc:      ["'self'", 'data:', 'https:'],
        connectSrc:  ["'self'"],
        fontSrc:     ["'self'"],
        objectSrc:   ["'none'"],
        mediaSrc:    ["'self'"],
        frameSrc:    ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,       // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff:       true,
    xssFilter:     true,
    hidePoweredBy: true,
    frameguard:    { action: 'deny' },
  }));

  // Enforce HTTPS in production — only runs when trust proxy is configured
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
      res.redirect(301, `https://${req.headers.host}${req.url}`);
    });
  }

  // Prevent HTTP parameter pollution (keep first value only)
  app.use((req, _res, next) => {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) req.query[key] = req.query[key][0];
    }
    next();
  });
};

/**
 * Returns pg Pool SSL options based on environment.
 * In production, require SSL and reject self-signed certs unless
 * DB_SSL_REJECT_UNAUTHORIZED=false is explicitly set (e.g. for RDS with custom CA).
 */
const getDbSslConfig = () => {
  if (process.env.NODE_ENV !== 'production') return false;
  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
};

module.exports = { applySecurityMiddleware, getDbSslConfig };
