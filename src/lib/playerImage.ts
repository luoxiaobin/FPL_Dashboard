const PLAYER_IMAGE_VERSION = '2026-06';

export const TRANSPARENT_IMAGE_DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// ── FIFA World Cup 2026 national kit images ───────────────────────────────────

const getFifaKitUrl = (teamCode: number, size: '40x40' | '110x140') => {
  const suffix = size === '40x40' ? 'sm' : 'lg';
  return `https://play.fifa.com/football-worldcup-2026/utils/images/kits/${teamCode}_${suffix}.png?v=${PLAYER_IMAGE_VERSION}`;
};

export const getPlayerPhotoUrl = (
  _photoOrCode?: string | number | null,
  size: '40x40' | '110x140' = '110x140',
  _playerId?: number | null,
  teamCode?: number | null,
): string => {
  if (typeof teamCode === 'number' && Number.isFinite(teamCode)) {
    return getFifaKitUrl(teamCode, size);
  }
  return TRANSPARENT_IMAGE_DATA_URI;
};

// ── National team flag ────────────────────────────────────────────────────────

export const getNationFlagUrl = (teamCode: number): string =>
  `https://play.fifa.com/football-worldcup-2026/utils/images/flags/${teamCode}.png`;
