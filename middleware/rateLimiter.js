const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

/**
 * Create rate limiter with customizable settings
 * @param {number} windowMs - Time window in minutes
 * @param {number} max - Maximum requests allowed in time window
 * @param {string} message - Message to send when limit is exceeded
 */
const createRateLimiter = (
  windowMs = 15,
  max = 10000000,
  message = "Too many requests, please try again later"
) => {
  const limiter = rateLimit({
    windowMs: windowMs * 60 * 10000000, // Convert minutes to milliseconds
    max: max, // Limit each IP to max requests per windowMs
    message: { success: false, message },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Store for tracking requests
    handler: (req, res, options) => {
      logger.warn(
        `Rate limit exceeded: ${req.ip} - ${req.method} ${req.originalUrl}`
      );
      res.status(429).json(options.message);
    },
  });

  return limiter;
};

// Different limiters for different routes
const authLimiter = createRateLimiter(
  15,
  10,
  "Too many authentication attempts, please try again after 15 minutes"
);
const apiLimiter = createRateLimiter(
  15,
  100,
  "Too many API requests, please try again after 15 minutes"
);
const voteLimiter = createRateLimiter(
  5,
  20,
  "Too many voting attempts, please try again after 5 minutes"
);

module.exports = {
  authLimiter,
  apiLimiter,
  voteLimiter,
};
