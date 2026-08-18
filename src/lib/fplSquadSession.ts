import {
  decodeFplSquadImport,
  encodeFplSquadImport,
  type FplSquadImport,
} from './fplSquadImport';

export const CONFIRMED_FPL_SQUAD_SESSION_KEY = 'fpl-confirmed-squad-v1';

export function saveConfirmedFplSquad(value: FplSquadImport): void {
  sessionStorage.setItem(CONFIRMED_FPL_SQUAD_SESSION_KEY, encodeFplSquadImport(value));
}

export function readConfirmedFplSquad(): FplSquadImport | null {
  const encoded = sessionStorage.getItem(CONFIRMED_FPL_SQUAD_SESSION_KEY);
  if (!encoded) return null;
  try {
    return decodeFplSquadImport(encoded);
  } catch {
    sessionStorage.removeItem(CONFIRMED_FPL_SQUAD_SESSION_KEY);
    return null;
  }
}

export function clearConfirmedFplSquad(): void {
  sessionStorage.removeItem(CONFIRMED_FPL_SQUAD_SESSION_KEY);
}
