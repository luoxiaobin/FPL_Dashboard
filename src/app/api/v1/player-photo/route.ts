// This endpoint is deprecated. Player images are now served as club jersey
// icons directly from the FPL CDN on the client side. Any legacy requests
// receive a transparent GIF so nothing breaks.
import { NextResponse } from 'next/server';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

export async function GET() {
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
