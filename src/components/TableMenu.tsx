import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import { focusCell, useEditorDom } from './TableHandles';
import './TableHandles.css';

// Durée de l'appui long (toucher) qui ouvre le menu
const LONG_PRESS_DELAY = 500;
// Marge minimale entre le menu et le bord de l'écran
const VIEWPORT_MARGIN = 8;

type TableCommand = 'addRowAfter' | 'addColumnAfter' | 'deleteRow' | 'deleteColumn' | 'deleteTable';

const ITEMS: ({ label: string; command: TableCommand } | 'separator')[] = [
  { label: 'Insérer une ligne dessous', command: 'addRowAfter' },
  { label: 'Insérer une colonne à droite', command: 'addColumnAfter' },
  'separator',
  { label: 'Supprimer la ligne', command: 'deleteRow' },
  { label: 'Supprimer la colonne', command: 'deleteColumn' },
  { label: 'Supprimer le tableau', command: 'deleteTable' },
];

interface MenuState {
  x: number;
  y: number;
  cell: HTMLTableCellElement;
}

export function TableMenu({ editor }: { editor: Editor }) {
  const dom = useEditorDom(editor);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setMenu(null), []);

  // Ouverture : clic droit ou appui long sur une cellule
  useEffect(() => {
    if (!dom) return;
    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    let longPressed = false;

    const cellAt = (target: EventTarget | null) => {
      const cell = (target as Element | null)?.closest?.<HTMLTableCellElement>('td, th') ?? null;
      return cell && dom.contains(cell) ? cell : null;
    };

    const open = (cell: HTMLTableCellElement, x: number, y: number) => {
      if (focusCell(editor, cell)) setMenu({ x, y, cell });
    };

    const onContextMenu = (e: MouseEvent) => {
      const cell = cellAt(e.target);
      if (!cell) return; // hors tableau : menu natif du navigateur
      e.preventDefault();
      open(cell, e.clientX, e.clientY);
    };

    const cancelPress = () => {
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      cancelPress();
      longPressed = false;
      if (e.touches.length !== 1) return;
      const cell = cellAt(e.target);
      if (!cell) return;
      const { clientX, clientY } = e.touches[0];
      pressTimer = setTimeout(() => {
        pressTimer = null;
        longPressed = true;
        open(cell, clientX, clientY);
      }, LONG_PRESS_DELAY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      cancelPress();
      // Le menu vient de s'ouvrir : pas de clic synthétique qui le refermerait
      if (longPressed && e.cancelable) e.preventDefault();
      longPressed = false;
    };

    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', cancelPress, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);
    dom.addEventListener('touchcancel', cancelPress);
    return () => {
      cancelPress();
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', cancelPress);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', cancelPress);
      close();
    };
  }, [dom, editor, close]);

  // Fermeture : clic extérieur, Échap, défilement, redimensionnement
  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu, close]);

  // Garde le menu dans l'écran (mesuré après rendu, sans re-rendu)
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!menu || !el) return;
    const { width, height } = el.getBoundingClientRect();
    const maxX = window.innerWidth - width - VIEWPORT_MARGIN;
    const maxY = window.innerHeight - height - VIEWPORT_MARGIN;
    el.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(menu.x, maxX))}px`;
    el.style.top = `${Math.max(VIEWPORT_MARGIN, Math.min(menu.y, maxY))}px`;
  }, [menu]);

  if (!dom || !menu) return null;

  const run = (command: TableCommand) => {
    const { cell } = menu;
    close();
    // Position recalculée depuis la cellule DOM au moment du clic (le tableau a pu changer)
    if (!focusCell(editor, cell)) return;
    editor.chain().focus()[command]().run();
  };

  return createPortal(
    <div
      ref={menuRef}
      className="table-menu"
      role="menu"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {ITEMS.map((item, i) =>
        item === 'separator' ? (
          <div key={`sep-${i}`} className="table-menu-sep" role="separator" />
        ) : (
          <button
            key={item.command}
            type="button"
            role="menuitem"
            className="table-menu-item"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(item.command)}
          >
            {item.label}
          </button>
        )
      )}
    </div>,
    document.body
  );
}
