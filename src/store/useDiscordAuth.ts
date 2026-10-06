import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiscordUser } from '../types';

interface DiscordAuthState {
  user: DiscordUser | null;
  /** Discord OAuth access token — used by the PoliceOS API to verify who is calling. */
  accessToken: string | null;
  tokenExpiresAt: number | null;
  setUser: (user: DiscordUser, accessToken: string, expiresInSeconds: number) => void;
  logout: () => void;
}

export const useDiscordAuth = create<DiscordAuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      tokenExpiresAt: null,
      setUser: (user, accessToken, expiresInSeconds) =>
        set({ user, accessToken, tokenExpiresAt: Date.now() + expiresInSeconds * 1000 }),
      logout: () => set({ user: null, accessToken: null, tokenExpiresAt: null }),
    }),
    { name: 'policeos-discord-auth' }
  )
);

/** Token usable for API calls, or null when missing/expired (user must log in again). */
export function getValidDiscordToken(): string | null {
  const { accessToken, tokenExpiresAt } = useDiscordAuth.getState();
  if (!accessToken || !tokenExpiresAt || tokenExpiresAt <= Date.now()) return null;
  return accessToken;
}
