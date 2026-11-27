import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy from 'tippy.js';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { Code2, Heading1, Heading2, Heading3, ListTodo, List, Quote, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './SlashMenu.css';

export interface SlashItem {
  id: string;
  title: string;
  icon: LucideIcon;
  run: (editor: Editor, range: Range) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
  { id: 'code', title: 'Bloc de code', icon: Code2, run: (e, r) => e.chain().focus().deleteRange(r).setCodeBlock().run() },
  { id: 'h1', title: 'Titre 1', icon: Heading1, run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run() },
  { id: 'h2', title: 'Titre 2', icon: Heading2, run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run() },
  { id: 'h3', title: 'Titre 3', icon: Heading3, run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run() },
  { id: 'todo', title: 'Case à cocher', icon: ListTodo, run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
  { id: 'liste', title: 'Liste à puces', icon: List, run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
  { id: 'citation', title: 'Citation', icon: Quote, run: (e, r) => e.chain().focus().deleteRange(r).setBlockquote().run() },
  { id: 'separateur', title: 'Séparateur', icon: Minus, run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
];

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function filterSlashItems(query: string): SlashItem[] {
  const q = normalize(query.trim());
  if (!q) return SLASH_ITEMS;
  const idStarts: SlashItem[] = [];
  const others: SlashItem[] = [];
  for (const item of SLASH_ITEMS) {
    const id = normalize(item.id);
    const title = normalize(item.title);
    if (id.startsWith(q)) idStarts.push(item);
    else if (title.startsWith(q) || title.includes(q) || id.includes(q)) others.push(item);
  }
  return [...idStarts, ...others];
}

interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

const SlashMenu = forwardRef<{ onKeyDown: (p: { event: KeyboardEvent }) => boolean }, SlashMenuProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const count = props.items.length;

  // Retour à la première entrée quand la liste change (ajustement pendant le rendu)
  const [prevItems, setPrevItems] = useState(props.items);
  if (prevItems !== props.items) {
    setPrevItems(props.items);
    setSelectedIndex(0);
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (count === 0) return false;
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + count - 1) % count);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % count);
        return true;
      }
      if (event.key === 'Enter') {
        const item = props.items[selectedIndex];
        if (item) props.command(item);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="slash-menu">
      {props.items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={item.id}
            className={`slash-item ${index === selectedIndex ? 'is-selected' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => props.command(item)}
          >
            <Icon size={16} />
            <span className="slash-item-title">{item.title}</span>
            <span className="slash-item-id">/{item.id}</span>
          </button>
        );
      })}
    </div>
  );
});

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: '/',
        pluginKey: new PluginKey('slashCommands'),
        allowedPrefixes: [' '],
        startOfLine: false,
        allow: ({ state, range }) => !state.doc.resolve(range.from).parent.type.spec.code,
        items: ({ query }) => filterSlashItems(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let component: ReactRenderer<any, any> | null = null;
          let popup: ReturnType<typeof tippy> | null = null;

          const sync = (props: any) => {
            component?.updateProps(props);
            if (!popup) return;
            if (props.items.length === 0) popup[0].hide();
            else {
              if (props.clientRect) popup[0].setProps({ getReferenceClientRect: props.clientRect });
              popup[0].show();
            }
          };

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, { props, editor: props.editor });
              if (!props.clientRect) return;
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: props.items.length > 0,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate: (props) => sync(props),
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup?.[0].hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              popup?.[0].destroy();
              component?.destroy();
              popup = null;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
