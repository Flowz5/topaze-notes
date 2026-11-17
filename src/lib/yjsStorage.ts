import {
  Bytes, collection, deleteField, doc, getDocs, onSnapshot, serverTimestamp, writeBatch,
  type DocumentData, type Firestore, type QuerySnapshot, type WriteBatch,
} from 'firebase/firestore';

/**
 * Stockage de l'état Yjs d'une note.
 *
 * Avant, l'état complet était stocké en base64 dans le document de la note. Il grossit
 * avec l'historique d'édition (≈ 4-5× le texte visible, +33 % de base64) et finissait par
 * dépasser la limite de 1 Mo d'un document Firestore : les sauvegardes échouaient.
 *
 * Maintenant : binaire brut (type Bytes) découpé en morceaux dans la sous-collection
 * `notes/{noteId}/yjs/{index}`. Les morceaux sont écrits dans le même batch que la note,
 * et les morceaux en trop sont supprimés dans ce batch : un snapshot de la sous-collection
 * contient donc toujours un état complet et cohérent.
 */

// Marge sous la limite de 1 Mio par document (le champ et les métadonnées comptent aussi)
export const YJS_CHUNK_SIZE = 900_000;
// Au-delà, le batch dépasserait la taille maximale d'une requête Firestore (10 Mio)
export const YJS_MAX_CHUNKS = 10;

const yjsCollection = (db: Firestore, kbId: string, noteId: string) =>
  collection(db, `knowledgeBases/${kbId}/notes/${noteId}/yjs`);

/** Ajoute au batch l'écriture de l'état Yjs. Renvoie le nombre de morceaux écrits. */
export function addYjsStateToBatch(
  batch: WriteBatch,
  db: Firestore,
  kbId: string,
  noteId: string,
  state: Uint8Array,
  previousChunkCount: number,
): number {
  const count = Math.max(1, Math.ceil(state.byteLength / YJS_CHUNK_SIZE));
  if (count > YJS_MAX_CHUNKS) {
    throw new Error(`Note trop volumineuse pour être sauvegardée (${(state.byteLength / 1e6).toFixed(1)} Mo)`);
  }
  const col = yjsCollection(db, kbId, noteId);
  for (let i = 0; i < count; i++) {
    const slice = state.subarray(i * YJS_CHUNK_SIZE, (i + 1) * YJS_CHUNK_SIZE);
    batch.set(doc(col, String(i)), { index: i, data: Bytes.fromUint8Array(slice), updatedAt: serverTimestamp() });
  }
  for (let i = count; i < previousChunkCount; i++) batch.delete(doc(col, String(i)));
  // Migration : l'ancien champ base64 n'a plus de raison d'être
  batch.update(doc(db, `knowledgeBases/${kbId}/notes/${noteId}`), { yjsState: deleteField() });
  return count;
}

/** Recolle les morceaux d'un snapshot de la sous-collection. null si aucun état. */
export function assembleYjsState(snapshot: QuerySnapshot<DocumentData>): Uint8Array | null {
  if (snapshot.empty) return null;
  const parts = snapshot.docs
    .map((d) => d.data() as { index: number; data: Bytes })
    .sort((a, b) => a.index - b.index)
    .map((d) => d.data.toUint8Array());
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.byteLength; }
  return out;
}

export async function loadYjsState(db: Firestore, kbId: string, noteId: string) {
  const snapshot = await getDocs(yjsCollection(db, kbId, noteId));
  return { state: assembleYjsState(snapshot), chunkCount: snapshot.size };
}

/** Écoute l'état sauvegardé par les autres clients (ignore nos propres écritures en attente). */
export function subscribeYjsState(
  db: Firestore, kbId: string, noteId: string,
  onState: (state: Uint8Array, chunkCount: number) => void,
) {
  return onSnapshot(yjsCollection(db, kbId, noteId), { includeMetadataChanges: false }, (snapshot) => {
    if (snapshot.metadata.hasPendingWrites) return;
    const state = assembleYjsState(snapshot);
    if (state) onState(state, snapshot.size);
  }, (err) => console.error('Écoute Yjs :', err));
}

/** Supprime tous les morceaux d'état Yjs d'une note (à appeler avant/avec la note). */
export async function deleteYjsState(db: Firestore, kbId: string, noteId: string) {
  const snapshot = await getDocs(yjsCollection(db, kbId, noteId));
  if (snapshot.empty) return;
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/** Décode l'ancien format (base64 dans le document de la note). */
export function decodeLegacyYjsState(b64?: string): Uint8Array | null {
  if (!b64) return null;
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}
