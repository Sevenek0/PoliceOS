// System dostępu na zaproszenie — dane w MariaDB (tabele `access` i `invites`),
// obsługiwane przez PoliceOS API. Tożsamość ustala serwer na podstawie tokenu
// Discorda, więc żadna funkcja nie przyjmuje ID wywołującego.
import { apiCall, ApiError } from './api';

export type AccessStatus = 'authorized' | 'denied' | 'error';

export interface RedeemResult {
  ok: boolean;
  error?: string;
}

export interface CreateInviteResult {
  code?: string;
  error?: string;
}

export interface MyInvite {
  code: string;
  createdAt: string;
  usedBy: string | null;
  usedByUsername: string | null;
  usedAt: string | null;
}

export interface AccessRow {
  discordId: string;
  username: string | null;
  invitedBy: string | null;
  createdAt: string;
}

export interface AdminInviteRow {
  code: string;
  createdBy: string;
  usedBy: string | null;
  usedByUsername: string | null;
  createdAt: string;
  usedAt: string | null;
}

export const MAX_INVITES = 5;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Owner always passes; everyone else needs a row in the `access` table (granted via a redeemed invite). */
export async function checkAccess(): Promise<AccessStatus> {
  try {
    const data = await apiCall<{ authorized: boolean }>('access', { action: 'check' });
    return data.authorized ? 'authorized' : 'denied';
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return 'denied';
    return 'error';
  }
}

export async function redeemInvite(code: string): Promise<RedeemResult> {
  try {
    await apiCall('access', { action: 'redeem', code: code.trim().toUpperCase() });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Nie udało się aktywować kodu.') };
  }
}

export async function createInvite(): Promise<CreateInviteResult> {
  try {
    const data = await apiCall<{ code: string }>('access', { action: 'createInvite' });
    return { code: data.code };
  } catch (err) {
    return { error: errorMessage(err, 'Nie udało się wygenerować kodu.') };
  }
}

export async function listMyInvites(): Promise<MyInvite[]> {
  const data = await apiCall<{ invites: MyInvite[] }>('access', { action: 'myInvites' });
  return data.invites;
}

export async function cancelInvite(code: string): Promise<boolean> {
  try {
    await apiCall('access', { action: 'cancelInvite', code });
    return true;
  } catch {
    return false;
  }
}

/** Owner-only: full access list and every invite code in the system. */
export async function adminOverview(): Promise<{ access: AccessRow[]; invites: AdminInviteRow[] }> {
  return apiCall('access', { action: 'adminOverview' });
}

export async function adminGrantAccess(discordId: string, username: string): Promise<boolean> {
  try {
    await apiCall('access', { action: 'adminGrant', discordId, username });
    return true;
  } catch {
    return false;
  }
}

export async function adminRevokeAccess(discordId: string): Promise<boolean> {
  try {
    await apiCall('access', { action: 'adminRevoke', discordId });
    return true;
  } catch {
    return false;
  }
}

export async function adminCancelInvite(code: string): Promise<boolean> {
  try {
    await apiCall('access', { action: 'adminCancelInvite', code });
    return true;
  } catch {
    return false;
  }
}
