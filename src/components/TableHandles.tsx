import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Editor } from '@tiptap/react';
import { Selection } from '@tiptap/pm/state';
import { Plus } from 'lucide-react';
import './TableHandles.css';

// Délai avant de cacher les « + » : laisse le temps d'aller de la cellule au bouton
const HIDE_DELAY = 150;
// Décalage des « + » par rapport au bord du tableau (le bouton fait 18 px)
const HANDLE_OFFSET = 12;

/** DOM de l'éditeur, ou null s'il n'est pas (ou plus) monté. */
function getEditorDom(editor: Editor): HTMLElement | null {
  if (editor.isDestroyed) return null;
  try {
    return editor.view.dom;
  } catch {
    // Tiptap lève une erreur tant que la vue n'est pas montée
    return null;
  }
}

/** Suit le DOM de l'éditeur (monté, démonté, détruit). */
export function useEditorDom(editor: Editor): HTMLElement | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      editor.on('mount', onChange);
      editor.on('unmount', onChange);
      editor.on('destroy', onChange);
      return () => {
        editor.off('mount', onChange);
        editor.off('unmount', onChange);
        editor.off('destroy', onChange);
      };
    },
    [editor]
  );
  return useSyncExternalStore(subscribe, () => getEditorDom(editor));
}

/**
 * Place le curseur dans la cellule DOM donnée (position recalculée maintenant, jamais mémorisée :
 * un collaborateur a pu modifier le tableau entre-temps). false si la cellule n'existe plus.
 */
export function focusCell(editor: Editor, cell: HTMLTableCellElement): boolean {
  const dom = getEditorDom(editor);
  if (!dom || !cell.isConnected || !dom.contains(cell)) return false;
  try {
    const pos = editor.view.posAtDOM(cell, 0);
    const $pos = editor.state.doc.resolve(pos);
    const cellNode = $pos.parent;
    if (cellNode.type.name !== 'tableCell' && cellNode.type.name !== 'tableHeader') return false;
    // posAtDOM donne le début du contenu de la cellule : on descend dans son premier paragraphe
    const target = Selection.near($pos, 1).from;
    if (target < pos || target > pos + cellNode.content.size) return false;
    return editor.commands.setTextSelection(target);
  } catch {
    return false;
  }
}

interface HandlePositions {
  /** Centre du « + » colonne (null si le bord droit de la cellule est hors de la zone visible) */
  col: { left: number; top: number } | null;
  /** Centre du « + » ligne */
  row: { left: number; top: number };
}

export function TableHandles({ editor }: { editor: Editor }) {
  const dom = useEditorDom(editor);
  const [positions, setPositions] = useState<HandlePositions | null>(null);
  // Cellule DOM survolée (pas une position du document, qui peut changer à tout moment)
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    cancelHide();
    cellRef.current = null;
    setPositions(null);
  }, [cancelHide]);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current !== null) return;
    hideTimerRef.current = setTimeout(hide, HIDE_DELAY);
  }, [hide]);

  useEffect(() => {
    if (!dom) return;
    const wrapper = dom.closest<HTMLElement>('.tiptap-wrapper');
    if (!wrapper) return;

    const measure = (cell: HTMLTableCellElement) => {
      const table = cell.closest('table');
      if (!table || !cell.isConnected || !dom.contains(cell)) {
        hide();
        return;
      }
      const scroller = cell.closest('.tableWrapper') ?? table;
      const wrapperRect = wrapper.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      // Tableau qui défile horizontalement : pas de « + » colonne pour un bord masqué
      const colVisible = cellRect.right >= scrollerRect.left && cellRect.right <= scrollerRect.right + 1;
      setPositions({
        col: colVisible
          ? { left: cellRect.right - wrapperRect.left, top: tableRect.top - wrapperRect.top - HANDLE_OFFSET }
          : null,
        row: {
          left: Math.max(tableRect.left, scrollerRect.left) - wrapperRect.left - HANDLE_OFFSET,
          top: cellRect.bottom - wrapperRect.top,
        },
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const cell = target?.closest?.<HTMLTableCellElement>('td, th') ?? null;
      if (!cell || !dom.contains(cell)) {
        scheduleHide();
        return;
      }
      cancelHide();
      if (cell !== cellRef.current) {
        cellRef.current = cell;
        measure(cell);
      }
    };

    // Le tableau a changé (moi ou un collaborateur) : on remesure la cellule si elle existe encore
    const onUpdate = () => {
      if (cellRef.current) measure(cellRef.current);
    };

    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('mouseleave', scheduleHide);
    // Capture : attrape aussi le défilement interne d'un .tableWrapper
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    editor.on('update', onUpdate);
    return () => {
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('mouseleave', scheduleHide);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      editor.off('update', onUpdate);
      hide();
    };
  }, [dom, editor, hide, scheduleHide, cancelHide]);

  if (!dom || !positions) return null;

  const run = (command: 'addColumnAfter' | 'addRowAfter') => {
    const cell = cellRef.current;
    // Position recalculée depuis la cellule DOM au moment du clic
    if (!cell || !focusCell(editor, cell)) {
      hide();
      return;
    }
    editor.commands[command]();
  };

  return (
    <>
      {positions.col && (
        <button
          type="button"
          className="table-handle"
          style={{ left: positions.col.left, top: positions.col.top }}
          title="Ajouter une colonne à droite"
          aria-label="Ajouter une colonne à droite"
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
          onClick={() => run('addColumnAfter')}
        >
          <Plus size={12} />
        </button>
      )}
      <button
        type="button"
        className="table-handle"
        style={{ left: positions.row.left, top: positions.row.top }}
        title="Ajouter une ligne dessous"
        aria-label="Ajouter une ligne dessous"
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        onClick={() => run('addRowAfter')}
      >
        <Plus size={12} />
      </button>
    </>
  );
}
