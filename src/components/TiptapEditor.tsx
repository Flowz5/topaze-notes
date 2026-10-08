import { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import './TiptapEditor.css';

interface TiptapEditorProps {
  noteId: string;
  initialContent: string;
  initialYjsState?: string;
  onChange: (markdown: string, yjsState: string) => void;
  currentUser: { name: string, color: string };
}

export default function TiptapEditor({ noteId, initialContent, initialYjsState, onChange, currentUser }: TiptapEditorProps) {
  const ydoc = useMemo(() => new Y.Doc(), [noteId]);
  
  // Appliquer l'état Yjs initial depuis Firestore s'il existe
  useMemo(() => {
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
        console.error("Failed to parse initial yjs state", e);
      }
    }
  }, [ydoc, initialYjsState]);

  // Se connecter au salon WebRTC unique de cette note
  const provider = useMemo(() => new WebrtcProvider(`topaze-notes-${noteId}`, ydoc), [ydoc, noteId]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: { name: currentUser.name, color: currentUser.color },
      }),
      Placeholder.configure({
        placeholder: 'Écris ta note ici (en temps réel)...',
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
    },
  });

  // Restaurer le markdown s'il n'y a pas encore d'état Yjs (migration des vieilles notes)
  useEffect(() => {
    if (editor && !initialYjsState && initialContent && !editor.isDestroyed) {
      // @ts-ignore
      if (editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialYjsState, initialContent]);

  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  return (
    <div className="tiptap-wrapper">
      <EditorContent editor={editor} />
    </div>
  );
}
