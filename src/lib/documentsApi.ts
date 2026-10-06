import { apiCall } from './api';
import type { SavedDocument } from '../types';

type ServerDocument = Omit<SavedDocument, 'ownerId' | 'synced'>;

export async function listDocuments(): Promise<ServerDocument[]> {
  const data = await apiCall<{ documents: ServerDocument[] }>('documents', { action: 'list' });
  return data.documents;
}

export async function uploadDocument(doc: SavedDocument): Promise<void> {
  const { ownerId: _ownerId, synced: _synced, ...document } = doc;
  await apiCall('documents', { action: 'save', document });
}

export async function deleteDocument(id: string): Promise<void> {
  await apiCall('documents', { action: 'remove', id });
}
