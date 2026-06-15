import { type NextRequest } from "next/server";

/**
 * Simple in-memory rate limiter for Next.js API routes
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a request is rate limited
 * @returns true if request should be blocked, false if allowed
 */
export function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true;
  }

  entry.count++;
  return false;
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(
  key: string,
  maxRequests: number,
  windowMs: number,
): Record<string, string> {
  const entry = rateLimitMap.get(key);
  const remaining = entry
    ? Math.max(0, maxRequests - entry.count)
    : maxRequests;
  const resetTime = entry ? entry.resetTime : Date.now() + windowMs;

  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
  };
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitMap, 5 * 60 * 1000);
}

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
};

/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per 15 minutes
 */
export const authLimiter = {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
};

/**
 * Rate limiter for file uploads
 * 20 requests per hour
 */
export const uploadLimiter = {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000,
};

/**
 * Rate limiter for expensive operations (search, export)
 * 30 requests per minute
 */
export const searchLimiter = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

/**
 * Get client IP from request
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
