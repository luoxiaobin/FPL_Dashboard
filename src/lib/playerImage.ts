const PLAYER_IMAGE_VERSION = '2026-03';

export const TRANSPARENT_IMAGE_DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const normalizePlayerPhotoId = (value?: string | number | null) => {
  if (value === null || value === undefined) return '';
  return String(value).replace('.jpg', '').replace('.png', '').trim();
};

const getClubShirtUrl = (teamCode: number, size: '40x40' | '110x140') => {
  const shirtSize = size === '40x40' ? '66' : '110';
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-${shirtSize}.webp?v=${PLAYER_IMAGE_VERSION}`;
};

export const getPlayerPhotoUrl = (
  photoOrCode?: string | number | null,
  size: '40x40' | '110x140' = '110x140',
  playerId?: number | null,
  teamCode?: number | null,
) => {
  if (typeof teamCode === 'number' && Number.isFinite(teamCode)) {
    return getClubShirtUrl(teamCode, size);
  }

  const photoId = normalizePlayerPhotoId(photoOrCode);
  if (!photoId) return TRANSPARENT_IMAGE_DATA_URI;

  const playerIdQuery =
    typeof playerId === 'number' && Number.isFinite(playerId)
      ? `&playerId=${playerId}`
      : '';
  return `/api/v1/player-photo?photo=${encodeURIComponent(photoId)}&size=${size}${playerIdQuery}&v=${PLAYER_IMAGE_VERSION}`;
};
