import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OfficerProfile } from '../types';

interface DiscordProfilesState {
  profiles: Record<string, OfficerProfile>;
  save: (discordId: string, profile: OfficerProfile) => void;
  get: (discordId: string) => OfficerProfile | undefined;
}

/** Per-Discord-account snapshot of the officer profile, so returning users get their data back. */
export const useDiscordProfiles = create<DiscordProfilesState>()(
  persist(
    (set, get) => ({
      profiles: {},
      save: (discordId, profile) =>
        set((state) => ({ profiles: { ...state.profiles, [discordId]: profile } })),
      get: (discordId) => get().profiles[discordId],
    }),
    { name: 'policeos-discord-profiles' }
  )
);
