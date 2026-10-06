import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityEntry } from '../types';

interface ActivityLogState {
  entries: Record<string, ActivityEntry>;
  record: (kind: ActivityEntry['kind'], id: string, label: string) => void;
  topN: (n: number, kind?: ActivityEntry['kind']) => ActivityEntry[];
  recent: (n: number) => ActivityEntry[];
  countByKind: (kind: ActivityEntry['kind']) => number;
}

export const useActivityLog = create<ActivityLogState>()(
  persist(
    (set, get) => ({
      entries: {},
      record: (kind, id, label) => {
        const key = `${kind}:${id}`;
        set((state) => {
          const existing = state.entries[key];
          return {
            entries: {
              ...state.entries,
              [key]: {
                id,
                kind,
                label,
                count: (existing?.count ?? 0) + 1,
                lastOpened: Date.now(),
              },
            },
          };
        });
      },
      topN: (n, kind) => {
        const list = Object.values(get().entries).filter((e) => !kind || e.kind === kind);
        return list.sort((a, b) => b.count - a.count).slice(0, n);
      },
      recent: (n) => {
        const list = Object.values(get().entries);
        return list.sort((a, b) => b.lastOpened - a.lastOpened).slice(0, n);
      },
      countByKind: (kind) => Object.values(get().entries).filter((e) => e.kind === kind).length,
    }),
    { name: 'policeos-activity-log' }
  )
);
