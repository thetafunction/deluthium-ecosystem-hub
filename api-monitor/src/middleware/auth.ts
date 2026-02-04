import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

/**
 * Authentication middleware for API Monitor endpoints.
 * Validates API key from X-API-Key header or query parameter.
 */

const API_KEY = process.env.API_MONITOR_KEY;

// Public endpoints that don't require authentication
const PUBLIC_PATHS = ['/health', '/api/health'];

export interface AuthenticatedRequest extends Request {
  authenticated?: boolean;
}

/**
 * Validate API key authentication
 */
export function apiKeyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Skip auth for public endpoints
  if (PUBLIC_PATHS.includes(req.path)) {
    return next();
  }

  // Check if API_MONITOR_KEY is configured
  if (!API_KEY) {
    logger.warn('API_MONITOR_KEY not configured - authentication disabled');
    req.authenticated = false;
    return next();
  }

  // Get API key from header or query parameter
  const providedKey = req.headers['x-api-key'] as string || req.query.api_key as string;

  if (!providedKey) {
    logger.warn('API request without authentication', { 
      path: req.path, 
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Provide via X-API-Key header or api_key query parameter.',
    });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(providedKey, API_KEY)) {
    logger.warn('Invalid API key attempt', { 
      path: req.path, 
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key',
    });
    return;
  }

  req.authenticated = true;
  next();
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Rate limiting middleware (basic implementation)
 * For production, consider using express-rate-limit with Redis store
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    // Start new window
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', { ip: clientId, path: req.path });
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((clientData.resetTime - now) / 1000)} seconds.`,
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
    return;
  }
  
  clientData.count++;
  next();
}

/**
 * Clean up old rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);
