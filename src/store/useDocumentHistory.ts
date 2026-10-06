import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedDocument } from '../types';
import { useDiscordAuth } from './useDiscordAuth';
import { ApiError } from '../lib/api';
import { deleteDocument, listDocuments, uploadDocument } from '../lib/documentsApi';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface DocumentHistoryState {
  /** Local cache of documents; the server (PoliceOS API) is the source of truth. */
  documents: SavedDocument[];
  syncStatus: SyncStatus;
  syncError: string | null;
  syncNeedsLogin: boolean;
  save: (doc: Omit<SavedDocument, 'id' | 'savedAt' | 'ownerId' | 'synced'>) => void;
  remove: (id: string) => void;
  sync: () => Promise<void>;
}

function currentUserId(): string | null {
  return useDiscordAuth.getState().user?.id ?? null;
}

export const useDocumentHistory = create<DocumentHistoryState>()(
  persist(
    (set, get) => {
      function setError(err: unknown) {
        const needsLogin = err instanceof ApiError && err.needsLogin;
        const message = err instanceof Error ? err.message : 'Nie udało się zsynchronizować dokumentów.';
        set({ syncStatus: 'error', syncError: message, syncNeedsLogin: needsLogin });
      }

      function markSynced(id: string) {
        set((state) => ({ documents: state.documents.map((d) => (d.id === id ? { ...d, synced: true } : d)) }));
      }

      return {
        documents: [],
        syncStatus: 'idle',
        syncError: null,
        syncNeedsLogin: false,

        save: (doc) => {
          const saved: SavedDocument = {
            ...doc,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            savedAt: Date.now(),
            ownerId: currentUserId() ?? undefined,
            synced: false,
          };
          set((state) => ({ documents: [saved, ...state.documents] }));
          uploadDocument(saved)
            .then(() => {
              markSynced(saved.id);
              set({ syncStatus: 'synced', syncError: null, syncNeedsLogin: false });
            })
            .catch(setError);
        },

        remove: (id) => {
          const doc = get().documents.find((d) => d.id === id);
          set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
          if (doc?.synced) deleteDocument(id).catch(setError);
        },

        // Pulls the account's documents from the server and uploads anything saved
        // only in this browser (e.g. while the server was unreachable).
        sync: async () => {
          const userId = currentUserId();
          if (!userId || get().syncStatus === 'syncing') return;
          set({ syncStatus: 'syncing' });
          try {
            const pending = get().documents.filter(
              (d) => !d.synced && (d.ownerId === undefined || d.ownerId === userId)
            );
            const failed: SavedDocument[] = [];
            for (const doc of pending) {
              try {
                await uploadDocument(doc);
              } catch (err) {
                if (err instanceof ApiError && err.needsLogin) throw err;
                failed.push({ ...doc, ownerId: userId });
              }
            }

            const remote = await listDocuments();
            const remoteIds = new Set(remote.map((d) => d.id));
            const otherAccounts = get().documents.filter((d) => d.ownerId !== undefined && d.ownerId !== userId);
            const merged = [
              ...remote.map((d) => ({ ...d, ownerId: userId, synced: true })),
              ...failed.filter((d) => !remoteIds.has(d.id)),
            ].sort((a, b) => b.savedAt - a.savedAt);

            set({
              documents: [...merged, ...otherAccounts],
              syncStatus: failed.length > 0 ? 'error' : 'synced',
              syncError: failed.length > 0 ? 'Część dokumentów nie została jeszcze wysłana na serwer.' : null,
              syncNeedsLogin: false,
            });
          } catch (err) {
            setError(err);
          }
        },
      };
    },
    {
      name: 'policeos-document-history',
      partialize: (state) => ({ documents: state.documents }),
    }
  )
);

/** Documents belonging to the logged-in account. */
export function useMyDocuments(): SavedDocument[] {
  const documents = useDocumentHistory((s) => s.documents);
  const userId = useDiscordAuth((s) => s.user?.id);
  return documents.filter((d) => d.ownerId === undefined || d.ownerId === userId);
}
