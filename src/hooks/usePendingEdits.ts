import { useCallback, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';

type Edits<T> = Partial<T>;

/**
 * Gère les modifications locales d'une note tant que Firestore ne les a pas confirmées.
 *
 * Pourquoi : quand on tape, chaque sauvegarde déclenche un snapshot Firestore (local puis
 * accusé de réception serveur) qui contient la valeur *au moment de l'envoi*. Si on
 * remplace l'état local par ce snapshot, toutes les lettres tapées entre-temps sautent.
 *
 * - `applyLocalEdit` cumule les champs modifiés (au lieu de ne garder que le dernier appel
 *   comme le ferait un simple debounce) et programme une sauvegarde.
 * - `mergeWithLocal` superpose ces modifs en attente aux données reçues de Firestore.
 * - Une modif est oubliée seulement quand le serveur a confirmé exactement cette valeur.
 */
export function usePendingEdits<T extends { id: string }>(
  save: (itemId: string, edits: Edits<T>) => Promise<void>,
  { wait = 1000, maxWait = 2000 }: { wait?: number; maxWait?: number } = {}
) {
  const pendingRef = useRef<Record<string, Edits<T>>>({});
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(async () => {
    const entries = Object.entries(pendingRef.current);
    await Promise.all(
      entries.map(async ([itemId, edits]) => {
        const sent = { ...edits };
        try {
          await saveRef.current(itemId, sent);
        } catch (err) {
          console.error('Erreur de sauvegarde:', err);
          // Note supprimée entre-temps : inutile de garder ses modifs en attente
          if ((err as { code?: string })?.code === 'not-found') delete pendingRef.current[itemId];
          return;
        }
        const current = pendingRef.current[itemId];
        if (!current) return;
        for (const key of Object.keys(sent) as (keyof T)[]) {
          // Si l'utilisateur a retapé depuis l'envoi, on garde la valeur plus récente
          if (current[key] === sent[key]) delete current[key];
        }
        if (Object.keys(current).length === 0) delete pendingRef.current[itemId];
      })
    );
  }, []);

  const debouncedFlush = useMemo(
    () => debounce(() => { void flush(); }, wait, { maxWait }),
    [flush, wait, maxWait]
  );

  // On ne perd rien en quittant la base ou la page
  useEffect(() => {
    const onUnload = () => debouncedFlush.flush();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      debouncedFlush.flush();
    };
  }, [debouncedFlush]);

  const applyLocalEdit = useCallback(
    (itemId: string, edits: Edits<T>) => {
      pendingRef.current[itemId] = { ...pendingRef.current[itemId], ...edits };
      debouncedFlush();
    },
    [debouncedFlush]
  );

  const mergeWithLocal = useCallback(
    (items: T[]): T[] =>
      items.map((item) => {
        const pending = pendingRef.current[item.id];
        return pending ? { ...item, ...pending } : item;
      }),
    []
  );

  return { applyLocalEdit, mergeWithLocal };
}
