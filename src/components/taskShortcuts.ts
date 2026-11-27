import { Extension, InputRule } from '@tiptap/core';

// `- [ ] ` et `- [x] ` : dans un item de liste à puces, la saisie de la case convertit la liste en
// liste de tâches. Hors liste, `[ ] ` est déjà géré par TaskItem : on ne s'en occupe pas ici.
export const TaskShortcuts = Extension.create({
  name: 'taskShortcuts',

  addInputRules() {
    return [
      new InputRule({
        find: /^\s*\[( |x)\]\s$/,
        handler: ({ state, range, match, chain }) => {
          const { $from } = state.selection;
          const inBulletItem =
            $from.depth >= 2 &&
            $from.parent.type.name === 'paragraph' &&
            $from.node(-1).type.name === 'listItem' &&
            $from.node(-2).type.name === 'bulletList';
          if (!inBulletItem) return null;

          chain()
            .deleteRange(range)
            .toggleTaskList()
            .updateAttributes('taskItem', { checked: match[1] === 'x' })
            .run();
        },
      }),
    ];
  },
});
