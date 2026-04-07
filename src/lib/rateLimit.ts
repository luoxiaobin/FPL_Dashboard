export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store
// Note: In Vercel Edge functions, this state might be lost across different isolates/cold starts.
// For a production MVP without Redis, this still effectively throttles burst requests per active edge instance.
const rateLimitMap = new Map<string, RateLimitRecord>();

export default function rateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = rateLimitMap.get(ip)!;

  // Window expired, reset
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  // Too many requests
  if (record.count >= maxRequests) {
    return false;
  }

  // Increment tally
  record.count += 1;
  return true;
}
