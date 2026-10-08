import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import './MentionList.css';

// Le composant visuel de la petite popup
export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.title });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="mention-list">
      {props.items.length > 0 ? (
        props.items.map((item: any, index: number) => (
          <button
            className={`mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
            key={item.id}
            onClick={() => selectItem(index)}
          >
            {item.title || "Nouvelle Note"}
          </button>
        ))
      ) : (
        <div className="mention-item is-empty">Aucune note trouvée</div>
      )}
    </div>
  );
});

// La configuration pour Tiptap
export default function getSuggestionConfig(notesRef: React.MutableRefObject<{id: string, title: string}[]>) {
  return {
    items: ({ query }: { query: string }) => {
      // On filtre les notes en fonction de ce que l'utilisateur tape
      return notesRef.current
        .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5); // on n'affiche que les 5 premières
    },
    render: () => {
      let component: ReactRenderer;
      let popup: any;

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate(props: any) {
          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide();
            return true;
          }
          // @ts-ignore
          return component.ref?.onKeyDown(props);
        },

        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  };
}
