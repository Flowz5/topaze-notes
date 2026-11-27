import { memo, useEffect, useMemo, useState, useRef } from 'react';
import type { EditorProps } from '@tiptap/pm/view';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, ListTodo } from 'lucide-react';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { TableKit } from '@tiptap/extension-table';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import 'highlight.js/styles/atom-one-dark.css';

const lowlight = createLowlight(common);

// Origine donnée aux mises à jour Yjs reçues de Firestore (déjà sauvegardées)
const FIRESTORE_ORIGIN = 'firestore';
// Pause de frappe avant de remonter les modifs (et délai max pendant une frappe continue)
const LOCAL_CHANGE_WAIT = 300;
const LOCAL_CHANGE_MAX_WAIT = 1000;

// Une modif est "locale" si elle vient de l'éditeur (y-prosemirror) ou d'un annuler/rétablir.
// Les autres (WebRTC, Firestore) ont déjà été sauvegardées par leur auteur.
const isLocalOrigin = (origin: unknown) => origin === ySyncPluginKey || origin instanceof Y.UndoManager;

import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import Mention from '@tiptap/extension-mention';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import getSuggestionConfig from './mentionSuggestion';
import { SlashCommands } from './slashCommands';
import { TaskShortcuts } from './taskShortcuts';
import { ySyncPluginKey } from '@tiptap/y-tiptap';
import debounce from 'lodash/debounce';
import { db } from '../firebase';
import { decodeLegacyYjsState, loadYjsState, subscribeYjsState } from '../lib/yjsStorage';
import './TiptapEditor.css';

interface TiptapEditorProps {
  kbId: string;
  noteId: string;
  initialContent: string;
  /** Ancien format (base64 dans la note), utilisé seulement si la sous-collection est vide */
  legacyYjsState?: string;
  /** noteId explicite : l'envoi peut arriver après qu'on a changé de note */
  onChange: (noteId: string, markdown: string, yjsState: Uint8Array, mentions: string[]) => void;
  currentUser: { name: string, color: string };
  allNotes: { id: string, title: string }[];
  onNoteClick: (noteId: string) => void;
}

// Fonction récursive pour extraire les IDs de mentions
function extractMentions(node: any): string[] {
  let mentions: string[] = [];
  if (node.type === 'mention' && node.attrs && node.attrs.id) {
    mentions.push(node.attrs.id);
  }
  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child: any) => {
      mentions = mentions.concat(extractMentions(child));
    });
  }
  return mentions;
}

function TiptapEditor({ kbId, noteId, initialContent, legacyYjsState, onChange, currentUser, allNotes, onNoteClick }: TiptapEditorProps) {
  const [setup, setSetup] = useState<{ ydoc: Y.Doc; provider: WebrtcProvider; hasState: boolean } | null>(null);
  // Fourni par EditorInner : envoie immédiatement les modifs en attente
  const flushRef = useRef<(() => void) | null>(null);
  // L'ancien état n'est lu qu'au montage : ensuite la sous-collection fait foi
  const legacyRef = useRef(legacyYjsState);

  useEffect(() => {
    let cancelled = false;
    let provider: WebrtcProvider | null = null;
    let unsubscribe: (() => void) | null = null;
    // 1. Un document Yjs gère les conflits d'édition entre plusieurs personnes
    const ydoc = new Y.Doc();

    (async () => {
      // 2. Je restaure l'état sauvegardé (morceaux binaires, sinon ancien base64)
      let state: Uint8Array | null = null;
      try {
        state = (await loadYjsState(db, kbId, noteId)).state;
      } catch (e) {
        console.error("Impossible de charger l'état Yjs", e);
      }
      state ??= decodeLegacyYjsState(legacyRef.current);
      if (cancelled) return;
      if (state) {
        try {
          Y.applyUpdate(ydoc, state);
        } catch (e) {
          console.error("Impossible d'appliquer l'état Yjs", e);
        }
      }

      // 3. Salon WebRTC (peer-to-peer) pour le temps réel
      provider = new WebrtcProvider(`topaze-notes-${noteId}`, ydoc);
      // 4. Je récupère aussi ce que les autres sauvegardent (si on n'est pas connectés en P2P)
      unsubscribe = subscribeYjsState(db, kbId, noteId, (remote) => {
        try {
          Y.applyUpdate(ydoc, remote, FIRESTORE_ORIGIN);
        } catch (e) {
          console.error('Erreur lors de la mise à jour Yjs distante', e);
        }
      });
      setSetup({ ydoc, provider, hasState: state !== null });
    })();

    // 5. Si je change de note, je détruis tout proprement
    return () => {
      cancelled = true;
      // Avant de détruire le document, j'envoie ce qui n'a pas encore été remonté
      flushRef.current?.();
      flushRef.current = null;
      unsubscribe?.();
      provider?.destroy();
      ydoc.destroy();
      setSetup(null);
    };
  }, [kbId, noteId]);

  if (!setup) return <div className="tiptap-loading">Connexion au document...</div>;

  return (
    <EditorInner
      ydoc={setup.ydoc}
      provider={setup.provider}
      noteId={noteId}
      hasState={setup.hasState}
      flushRef={flushRef}
      initialContent={initialContent}
      onChange={onChange}
      currentUser={currentUser}
      allNotes={allNotes}
      onNoteClick={onNoteClick}
    />
  );
}

function EditorInner({ ydoc, provider, noteId, hasState, flushRef, initialContent, onChange, currentUser, allNotes, onNoteClick, }: any) {
  const notesRef = useRef(allNotes);
  const onChangeRef = useRef(onChange);
  const onNoteClickRef = useRef(onNoteClick);
  useEffect(() => {
    notesRef.current = allNotes;
    onChangeRef.current = onChange;
    onNoteClickRef.current = onNoteClick;
  }, [allNotes, onChange, onNoteClick]);

  // Extensions et props créées UNE fois par document : si elles changent à chaque rendu,
  // Tiptap reconfigure ProseMirror (view.setProps) à chaque rendu, donc à chaque frappe.
  const extensions = useMemo(() => [
    StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TableKit.configure({ table: { resizable: false } }),
      TaskShortcuts,
      CodeBlockLowlight.configure({ lowlight }),
      Markdown,
      Collaboration.configure({
        document: ydoc,
      }),
      // Curseur et sélection des autres personnes sur la note, avec leur nom
      CollaborationCaret.configure({
        provider,
        user: currentUser,
      }),
      Placeholder.configure({
        placeholder: 'Écris ta note ici (tape @ pour lier une note, / pour insérer un bloc)...',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: getSuggestionConfig(notesRef),
      }),
      SlashCommands,
  ], [ydoc, provider, currentUser]);

  const editorProps = useMemo<EditorProps>(() => ({
    attributes: {
      class: 'prose prose-invert focus:outline-none tiptap-editor',
    },
    handleClick(_view, _pos, event) {
      const target = event.target as HTMLElement;
      if (target && target.classList.contains('mention')) {
        const noteId = target.getAttribute('data-id');
        if (noteId) {
          onNoteClickRef.current(noteId);
          return true;
        }
      }
      return false;
    },
  }), []);

  // Je configure l'éditeur riche avec mes extensions (Markdown, Collab, etc.)
  const editor = useEditor({
    extensions,
    editorProps,
  });

  // Remontée des modifications vers la page (sauvegarde, recherche, backlinks).
  // Avant : à chaque frappe, markdown complet + encodage Yjs + mentions, même pour les
  // changements venus des autres (ou de la synchro initiale, pendant le rendu React).
  // Maintenant : seulement pour les modifs locales, et après une courte pause de frappe.
  useEffect(() => {
    if (!editor) return;
    let dirty = false;
    const emit = () => {
      if (!dirty || editor.isDestroyed) return;
      dirty = false;
      // @ts-expect-error -- stockage ajouté par l'extension tiptap-markdown
      const markdown: string = editor.storage.markdown.getMarkdown();
      const state = Y.encodeStateAsUpdate(ydoc);
      const mentions = Array.from(new Set(extractMentions(editor.getJSON())));
      onChangeRef.current(noteId, markdown, state, mentions);
    };
    const scheduled = debounce(emit, LOCAL_CHANGE_WAIT, { maxWait: LOCAL_CHANGE_MAX_WAIT });
    const flush = () => { scheduled.cancel(); emit(); };

    const onDocUpdate = (_update: Uint8Array, origin: unknown) => {
      if (!isLocalOrigin(origin)) return;
      dirty = true;
      scheduled();
    };
    ydoc.on('update', onDocUpdate);
    flushRef.current = flush;
    return () => {
      ydoc.off('update', onDocUpdate);
      flush();
      if (flushRef.current === flush) flushRef.current = null;
    };
  }, [editor, ydoc, noteId, flushRef]);

  // Note jamais ouverte dans l'éditeur (ex. note générée) : on part du contenu markdown
  useEffect(() => {
    if (editor && !hasState && initialContent && !editor.isDestroyed && editor.isEmpty) {
      editor.commands.setContent(initialContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uniquement à la création de l'éditeur
  }, [editor]);

  return (
    <div className="tiptap-wrapper">

      {editor && (
        <BubbleMenu 
          editor={editor}
          className="bubble-menu"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          >
            <Strikethrough size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`bubble-btn ${editor.isActive('code') ? 'is-active' : ''}`}
          >
            <Code size={16} />
          </button>
          <div className="bubble-sep" />
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`bubble-btn ${editor.isActive('taskList') ? 'is-active' : ''}`}
          >
            <ListTodo size={16} />
          </button>
          <div className="bubble-sep" />
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`bubble-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`bubble-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`bubble-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
          >
            <Heading3 size={16} />
          </button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

// Mémoïsé : ne se re-rend pas quand la page parente se re-rend (ex. à chaque frappe).
// initialContent et legacyYjsState ne servent qu'au montage : leurs changements sont ignorés.
const INITIAL_ONLY_PROPS = new Set(['initialContent', 'legacyYjsState']);
export default memo(TiptapEditor, (prev, next) =>
  (Object.keys(next) as (keyof TiptapEditorProps)[]).every(
    (key) => INITIAL_ONLY_PROPS.has(key) || prev[key] === next[key]
  )
);
