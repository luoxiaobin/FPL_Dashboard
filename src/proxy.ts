import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import rateLimit from './lib/rateLimit';

/**
 * Next.js 16 Proxy (formerly Middleware)
 * Handles rate limiting for API routes.
 */
export function proxy(request: NextRequest) {
  // Only apply rate limiting to /api/v1/ routes
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    // request.ip was removed in Next.js 15. Standard headers are used instead.
    const ip = 
      request.headers.get('x-real-ip') || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      '127.0.0.1';
      
    const isAllowed = rateLimit(ip);
    
    if (!isAllowed) {
      console.warn(`[RATE LIMIT EXCEEDED] Blocked IP: ${ip} on path: ${request.nextUrl.pathname}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests', message: 'You have hit the proxy rate limit of 30 req/min.' }),
        { 
          status: 429, 
          headers: { 'content-type': 'application/json', 'Retry-After': '60' } 
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/v1/:path*',
};
