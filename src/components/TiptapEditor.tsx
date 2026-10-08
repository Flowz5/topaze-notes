import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, ListTodo } from 'lucide-react';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import 'highlight.js/styles/atom-one-dark.css';

const lowlight = createLowlight(common);

import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import Collaboration from '@tiptap/extension-collaboration';
import Mention from '@tiptap/extension-mention';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import getSuggestionConfig from './mentionSuggestion';
import './TiptapEditor.css';

interface TiptapEditorProps {
  noteId: string;
  initialContent: string;
  initialYjsState?: string;
  onChange: (markdown: string, yjsState: string, mentions: string[]) => void;
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

export default function TiptapEditor({ noteId, initialContent, initialYjsState, onChange, currentUser, allNotes, onNoteClick }: TiptapEditorProps) {
  const [setup, setSetup] = useState<{ ydoc: Y.Doc; provider: WebrtcProvider } | null>(null);
  

  useEffect(() => {
    // 1. Je crée un nouveau document Yjs vide. C'est lui qui va gérer tous les conflits 
    // d'édition si plusieurs personnes tapent en même temps !
    const ydoc = new Y.Doc();

    // 2. Je restaure l'historique depuis Firestore s'il existe. 
    if (initialYjsState) {
      try {
        const binaryString = atob(initialYjsState);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        Y.applyUpdate(ydoc, bytes);
      } catch (e) {
        console.error("Impossible de parser l'état yjs", e);
      }
    }

    // 3. Je me connecte au salon WebRTC (peer-to-peer). 
    const provider = new WebrtcProvider(`topaze-notes-${noteId}`, ydoc);
    

    setSetup({ ydoc, provider });

    // 4. Ultra important : si je change de note, je dois détruire la connexion 
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [noteId]); // Le hook se relance automatiquement si l'ID de la note change

  if (!setup) return <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>Connexion au document...</div>;

  return (
    <EditorInner 
      ydoc={setup.ydoc} 
      provider={setup.provider} 
      initialContent={initialContent}
      initialYjsState={initialYjsState}
      onChange={onChange}
      currentUser={currentUser}
      allNotes={allNotes}
      onNoteClick={onNoteClick}
      
    />
  );
}

function EditorInner({ ydoc, initialContent, initialYjsState, onChange, allNotes, onNoteClick, }: any) {
  const notesRef = useRef(allNotes);
  useEffect(() => {
    notesRef.current = allNotes;
  }, [allNotes]);

  // Je configure l'éditeur riche avec mes extensions (Markdown, Collab, etc.)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Markdown,
      Collaboration.configure({
        document: ydoc,
      }),
      Placeholder.configure({
        placeholder: 'Écris ta note ici (tape @ pour lier une note)...',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: getSuggestionConfig(notesRef),
      }),
    ],
    onUpdate: ({ editor }) => {
      // @ts-ignore
      const markdown = editor.storage.markdown.getMarkdown();
      
      const stateUpdate = Y.encodeStateAsUpdate(ydoc);
      let binary = '';
      const len = stateUpdate.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(stateUpdate[i]);
      }
      const b64 = btoa(binary);
      
      const mentions = Array.from(new Set(extractMentions(editor.getJSON())));
      onChange(markdown, b64, mentions);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none tiptap-editor',
      },
      handleClick(_view, _pos, event) {
        const target = event.target as HTMLElement;
        if (target && target.classList.contains('mention')) {
          const noteId = target.getAttribute('data-id');
          if (noteId) {
            onNoteClick(noteId);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && !initialYjsState && initialContent && !editor.isDestroyed) {
      // @ts-ignore
      if (editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialYjsState, initialContent]);

  useEffect(() => {
    if (initialYjsState && ydoc) {
      try {
        const binaryString = atob(initialYjsState);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        Y.applyUpdate(ydoc, bytes);
      } catch (e) {
        console.error("Erreur lors de l'application de la mise à jour Firestore", e);
      }
    }
  }, [initialYjsState, ydoc]);

  return (
    <div className="tiptap-wrapper">

      {editor && (
        <BubbleMenu 
          editor={editor} 
          
          style={{
            zIndex: 9999,
            display: 'flex',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '0.25rem',
            borderRadius: '99px',
            gap: '0.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('bold') ? 'var(--primary)' : 'white', background: editor.isActive('bold') ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('italic') ? 'var(--primary)' : 'white', background: editor.isActive('italic') ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('strike') ? 'var(--primary)' : 'white', background: editor.isActive('strike') ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Strikethrough size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('code') ? 'var(--primary)' : 'white', background: editor.isActive('code') ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Code size={16} />
          </button>
          <div style={{ width: '1px', background: 'var(--border)', margin: '0.25rem' }}></div>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive('taskList') ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('taskList') ? 'var(--primary)' : 'white', background: editor.isActive('taskList') ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <ListTodo size={16} />
          </button>
          <div style={{ width: '1px', background: 'var(--border)', margin: '0.25rem' }}></div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('heading', { level: 1 }) ? 'var(--primary)' : 'white', background: editor.isActive('heading', { level: 1 }) ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('heading', { level: 2 }) ? 'var(--primary)' : 'white', background: editor.isActive('heading', { level: 2 }) ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('heading', { level: 3 }) ? 'var(--primary)' : 'white', background: editor.isActive('heading', { level: 3 }) ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Heading3 size={16} />
          </button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
