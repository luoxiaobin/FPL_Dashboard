import { NextRequest, NextResponse } from 'next/server';
import { revokeSession, clearSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  // H1 fix: revoke the session server-side (not just clear the cookie), so a
  // copy of the token captured before logout can't still be replayed.
  await revokeSession(req);

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);

  return response;
}
