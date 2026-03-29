import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the fpl_entry_id cookie
  response.cookies.set({
    name: 'fpl_entry_id',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0 // Expire instantly
  });

  return response;
}
