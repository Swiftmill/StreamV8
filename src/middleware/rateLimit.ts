import rateLimit from 'express-rate-limit';

export const adminRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin requests, please slow down.'
});
