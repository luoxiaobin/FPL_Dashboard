export const FPL_SQUAD_IMPORT_SCHEMA_VERSION = 1 as const;
export const FPL_SQUAD_IMPORT_SOURCE = 'fpl-authenticated-my-team' as const;

export interface FplImportedPick {
  elementId: number;
  lineupPosition: number;
  sellingPrice: number;
  purchasePrice: number;
  multiplier: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export interface FplSquadImport {
  schemaVersion: typeof FPL_SQUAD_IMPORT_SCHEMA_VERSION;
  source: typeof FPL_SQUAD_IMPORT_SOURCE;
  entryId: number;
  capturedAt: string;
  activeChip: string | null;
  picks: FplImportedPick[];
  transfers: {
    bank: number;
    squadValue: number;
    freeTransfers: number | null;
    transfersMade: number;
    transferCost: number;
    status: string;
  };
}

export class FplSquadImportValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid FPL squad import: ${issues.join('; ')}`);
    this.name = 'FplSquadImportValidationError';
  }
}

const TOP_LEVEL_KEYS = ['activeChip', 'capturedAt', 'entryId', 'picks', 'schemaVersion', 'source', 'transfers'];
const PICK_KEYS = ['elementId', 'isCaptain', 'isViceCaptain', 'lineupPosition', 'multiplier', 'purchasePrice', 'sellingPrice'];
const TRANSFER_KEYS = ['bank', 'freeTransfers', 'squadValue', 'status', 'transferCost', 'transfersMade'];

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const hasExactKeys = (value: Record<string, unknown>, expected: string[]): boolean => {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
};

const isIntegerBetween = (value: unknown, min: number, max: number): value is number => (
  Number.isInteger(value) && Number(value) >= min && Number(value) <= max
);

export function parseFplSquadImport(value: unknown): FplSquadImport {
  const issues: string[] = [];
  if (!isRecord(value)) throw new FplSquadImportValidationError(['payload must be an object']);

  if (!hasExactKeys(value, TOP_LEVEL_KEYS)) issues.push('payload fields do not match schema');
  if (value.schemaVersion !== FPL_SQUAD_IMPORT_SCHEMA_VERSION) issues.push('unsupported schema version');
  if (value.source !== FPL_SQUAD_IMPORT_SOURCE) issues.push('untrusted import source');
  if (!isIntegerBetween(value.entryId, 1, 999_999_999)) issues.push('entryId must be a positive integer');
  if (typeof value.capturedAt !== 'string' || Number.isNaN(Date.parse(value.capturedAt))) {
    issues.push('capturedAt must be a valid timestamp');
  }
  if (value.activeChip !== null && (
    typeof value.activeChip !== 'string' || !/^[a-z0-9_]{1,32}$/.test(value.activeChip)
  )) issues.push('activeChip is invalid');

  if (!Array.isArray(value.picks) || value.picks.length !== 15) {
    issues.push('picks must contain exactly 15 players');
  } else {
    const elementIds = new Set<number>();
    const positions = new Set<number>();
    let captains = 0;
    let viceCaptains = 0;

    value.picks.forEach((pick, index) => {
      if (!isRecord(pick) || !hasExactKeys(pick, PICK_KEYS)) {
        issues.push(`pick ${index + 1} fields do not match schema`);
        return;
      }
      if (!isIntegerBetween(pick.elementId, 1, 99_999)) issues.push(`pick ${index + 1} has invalid elementId`);
      if (!isIntegerBetween(pick.lineupPosition, 1, 15)) issues.push(`pick ${index + 1} has invalid lineupPosition`);
      if (!isIntegerBetween(pick.sellingPrice, 0, 2_000)) issues.push(`pick ${index + 1} has invalid sellingPrice`);
      if (!isIntegerBetween(pick.purchasePrice, 0, 2_000)) issues.push(`pick ${index + 1} has invalid purchasePrice`);
      if (!isIntegerBetween(pick.multiplier, 0, 3)) issues.push(`pick ${index + 1} has invalid multiplier`);
      if (typeof pick.isCaptain !== 'boolean' || typeof pick.isViceCaptain !== 'boolean') {
        issues.push(`pick ${index + 1} has invalid captaincy flags`);
      }
      if (pick.isCaptain === true) captains += 1;
      if (pick.isViceCaptain === true) viceCaptains += 1;
      if (typeof pick.elementId === 'number') elementIds.add(pick.elementId);
      if (typeof pick.lineupPosition === 'number') positions.add(pick.lineupPosition);
    });

    if (elementIds.size !== 15) issues.push('player IDs must be unique');
    if (positions.size !== 15) issues.push('lineup positions must be unique');
    if (captains !== 1) issues.push('exactly one captain is required');
    if (viceCaptains !== 1) issues.push('exactly one vice captain is required');
  }

  if (!isRecord(value.transfers) || !hasExactKeys(value.transfers, TRANSFER_KEYS)) {
    issues.push('transfer fields do not match schema');
  } else {
    const transfers = value.transfers;
    if (!isIntegerBetween(transfers.bank, 0, 2_000)) issues.push('bank is invalid');
    if (!isIntegerBetween(transfers.squadValue, 0, 2_000)) issues.push('squadValue is invalid');
    if (transfers.freeTransfers !== null && !isIntegerBetween(transfers.freeTransfers, 0, 15)) issues.push('freeTransfers is invalid');
    if (!isIntegerBetween(transfers.transfersMade, 0, 100)) issues.push('transfersMade is invalid');
    if (!isIntegerBetween(transfers.transferCost, 0, 100)) issues.push('transferCost is invalid');
    if (typeof transfers.status !== 'string' || !/^[a-z_]{1,32}$/.test(transfers.status)) issues.push('transfer status is invalid');
  }

  if (issues.length > 0) throw new FplSquadImportValidationError(issues);
  return value as unknown as FplSquadImport;
}
