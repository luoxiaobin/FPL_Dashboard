import { NextRequest, NextResponse } from 'next/server';

const PLAYER_IMAGE_VERSION = '2026-03';
const STALE_CUTOFF_MS = Date.parse('2025-07-01T00:00:00.000Z');
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const BOOTSTRAP_TTL_MS = 15 * 60 * 1000; // 15 mins

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

const staleCache = new Map<string, { stale: boolean; expiresAt: number }>();

let bootstrapCache: any = null;
let bootstrapCacheExpiresAt = 0;

const getTransparentImageResponse = () =>
  new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'public, max-age=3600, immutable',
    },
  });

const getClubShirtUrl = (teamCode: number, size: '40x40' | '110x140') => {
  const shirtSize = size === '40x40' ? '66' : '110';
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-${shirtSize}.webp`;
};

const getShirtFallbackResponse = (teamCode?: number | null, size: '40x40' | '110x140' = '110x140') => {
  if (typeof teamCode === 'number' && Number.isFinite(teamCode) && teamCode > 0) {
    return NextResponse.redirect(getClubShirtUrl(teamCode, size), 307);
  }
  return getTransparentImageResponse();
};

const isAllowedSize = (size: string) => size === '40x40' || size === '110x140';

const parseIsStale = (lastModifiedHeader: string | null) => {
  if (!lastModifiedHeader) return false;
  const modifiedAt = Date.parse(lastModifiedHeader);
  if (Number.isNaN(modifiedAt)) return false;
  return modifiedAt < STALE_CUTOFF_MS;
};

const getBootstrap = async () => {
  const now = Date.now();
  if (bootstrapCache && bootstrapCacheExpiresAt > now) return bootstrapCache;
  const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  bootstrapCache = await res.json();
  bootstrapCacheExpiresAt = now + BOOTSTRAP_TTL_MS;
  return bootstrapCache;
};

const getPlayerImageMeta = async (playerId: number) => {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.elements) return { recentTransfer: false, teamCode: null as number | null };
  const player = bootstrap.elements.find((el: any) => el.id === playerId);
  if (!player) return { recentTransfer: false, teamCode: null as number | null };
  const teamCode = typeof player.team_code === 'number' ? player.team_code : null;
  if (!player.team_join_date) return { recentTransfer: false, teamCode };
  const joinedAt = Date.parse(player.team_join_date);
  if (Number.isNaN(joinedAt)) return { recentTransfer: false, teamCode };
  return { recentTransfer: joinedAt >= STALE_CUTOFF_MS, teamCode };
};

export async function GET(req: NextRequest) {
  const photo = req.nextUrl.searchParams.get('photo')?.trim();
  const sizeParam = req.nextUrl.searchParams.get('size')?.trim() || '110x140';
  const playerIdParam = req.nextUrl.searchParams.get('playerId')?.trim();
  const teamCodeParam = req.nextUrl.searchParams.get('teamCode')?.trim();
  const playerId = playerIdParam ? Number(playerIdParam) : Number.NaN;
  const teamCode = teamCodeParam ? Number(teamCodeParam) : Number.NaN;

  if (!photo) return getTransparentImageResponse();
  if (!isAllowedSize(sizeParam)) return getTransparentImageResponse();

  const normalizedPhoto = photo.replace('.jpg', '').replace('.png', '');
  const cacheKey = `${sizeParam}:${normalizedPhoto}`;
  const now = Date.now();

  const cached = staleCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    if (cached.stale && Number.isFinite(playerId)) {
      const meta = await getPlayerImageMeta(playerId);
      if (meta.recentTransfer) {
        return getShirtFallbackResponse(
          meta.teamCode ?? (Number.isFinite(teamCode) ? teamCode : null),
          sizeParam as '40x40' | '110x140',
        );
      }
    }
    const upstream = `https://resources.premierleague.com/premierleague/photos/players/${sizeParam}/p${normalizedPhoto}.png?v=${PLAYER_IMAGE_VERSION}`;
    return NextResponse.redirect(upstream, 307);
  }

  const upstream = `https://resources.premierleague.com/premierleague/photos/players/${sizeParam}/p${normalizedPhoto}.png?v=${PLAYER_IMAGE_VERSION}`;

  try {
    const headRes = await fetch(upstream, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    });

    if (!headRes.ok) {
      staleCache.set(cacheKey, { stale: true, expiresAt: now + CACHE_TTL_MS });
      return getTransparentImageResponse();
    }

    const stale = parseIsStale(headRes.headers.get('last-modified'));
    staleCache.set(cacheKey, { stale, expiresAt: now + CACHE_TTL_MS });

    if (stale && Number.isFinite(playerId)) {
      const meta = await getPlayerImageMeta(playerId);
      if (meta.recentTransfer) {
        return getShirtFallbackResponse(
          meta.teamCode ?? (Number.isFinite(teamCode) ? teamCode : null),
          sizeParam as '40x40' | '110x140',
        );
      }
    }
    return NextResponse.redirect(upstream, 307);
  } catch {
    staleCache.set(cacheKey, { stale: false, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.redirect(upstream, 307);
  }
}
