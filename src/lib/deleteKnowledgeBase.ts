import { collection, doc, getDoc, getDocs, writeBatch, deleteDoc, type Firestore } from 'firebase/firestore';

// Firestore limite un batch à 500 opérations
const BATCH_LIMIT = 500;

/**
 * Supprime une base de connaissances ET tout son contenu (notes, dossiers).
 *
 * Firestore ne supprime pas les sous-collections avec le document parent : sans ça,
 * les notes restaient orphelines dans la base de données.
 * L'ordre compte : les règles de sécurité vérifient l'accès via le document de la base,
 * donc on vide d'abord les sous-collections et on supprime la base en dernier.
 * On vérifie le propriétaire AVANT : un invité a le droit de supprimer des notes, il
 * pourrait donc vider la base avant de se voir refuser la suppression du document.
 */
export async function deleteKnowledgeBase(db: Firestore, kbId: string, uid: string): Promise<void> {
  const base = await getDoc(doc(db, 'knowledgeBases', kbId));
  if (!base.exists()) return;
  if (base.data().ownerId !== uid) {
    throw new Error('Seul le propriétaire peut supprimer cette base.');
  }

  for (const sub of ['notes', 'folders']) {
    const snapshot = await getDocs(collection(db, `knowledgeBases/${kbId}/${sub}`));
    for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      snapshot.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  await deleteDoc(doc(db, 'knowledgeBases', kbId));
}
