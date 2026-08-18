import {
  FPL_SQUAD_IMPORT_SCHEMA_VERSION,
  FPL_SQUAD_IMPORT_SOURCE,
} from '@/lib/fplSquadImport';
import { getReleaseIdentity } from '@/lib/release';

export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    status: 'ready',
    contract: {
      schemaVersion: FPL_SQUAD_IMPORT_SCHEMA_VERSION,
      source: FPL_SQUAD_IMPORT_SOURCE,
      squadSize: 15,
      uniquePlayers: true,
      uniqueLineupPositions: true,
      captainRequired: true,
      viceCaptainRequired: true,
      unexpectedFields: 'rejected',
      persistence: 'confirmed-server-side',
      replacement: 'latest-confirmation-wins',
      clearing: 'explicit',
      expiry: 'gameweek-deadline-plus-two-hours',
      publicPicksHandoff: 'automatic',
    },
    release: getReleaseIdentity(),
  });
}
