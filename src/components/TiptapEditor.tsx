import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
  onChange: (markdown: string, yjsState: string) => void;
  currentUser: { name: string, color: string };
  allNotes: { id: string, title: string }[];
  onNoteClick: (noteId: string) => void;
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

function EditorInner({ ydoc, initialContent, initialYjsState, onChange, allNotes, onNoteClick }: any) {
  const notesRef = useRef(allNotes);
  useEffect(() => {
    notesRef.current = allNotes;
  }, [allNotes]);

  const editor = useEditor({
    extensions: [
      StarterKit,
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
      
      onChange(markdown, b64);
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
      <EditorContent editor={editor} />
    </div>
  );
}
