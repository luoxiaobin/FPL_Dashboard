const PLAYER_IMAGE_VERSION = '2026-03';

export const TRANSPARENT_IMAGE_DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const getClubShirtUrl = (teamCode: number, size: '40x40' | '110x140') => {
  const shirtSize = size === '40x40' ? '66' : '110';
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}-${shirtSize}.webp?v=${PLAYER_IMAGE_VERSION}`;
};

export const getPlayerPhotoUrl = (
  _photoOrCode?: string | number | null,
  size: '40x40' | '110x140' = '110x140',
  _playerId?: number | null,
  teamCode?: number | null,
) => {
  if (typeof teamCode === 'number' && Number.isFinite(teamCode)) {
    return getClubShirtUrl(teamCode, size);
  }

  return TRANSPARENT_IMAGE_DATA_URI;
};
