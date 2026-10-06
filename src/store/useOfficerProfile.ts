import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OfficerProfile } from '../types';

interface OfficerProfileState extends OfficerProfile {
  update: (patch: Partial<OfficerProfile>) => void;
}

const DEFAULT_PROFILE: OfficerProfile = {
  name: '',
  position: 'Officer I',
  badge: '',
  unit: '',
  accent: 'navy',
  theme: 'dark',
  onboarded: false,
};

export const useOfficerProfile = create<OfficerProfileState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      update: (patch) => set(patch),
    }),
    { name: 'policeos-officer-profile' }
  )
);
