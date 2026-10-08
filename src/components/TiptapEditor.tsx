import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import Collaboration from '@tiptap/extension-collaboration';
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
  const [setup, setSetup] = useState<{ ydoc: Y.Doc; provider: WebrtcProvider } | null>(null);

  useEffect(() => {
    // 1. Je crée un nouveau document Yjs vide. C'est lui qui va gérer tous les conflits 
    // d'édition si plusieurs personnes tapent en même temps !
    const ydoc = new Y.Doc();

    // 2. Je restaure l'historique depuis Firestore s'il existe. 
    // Comme Firestore ne gère pas bien le binaire brut, je dois convertir 
    // le base64 (string) en Uint8Array pour que Yjs puisse le lire.
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
    // Le nom du salon doit être unique pour chaque note, sinon tout le monde 
    // se retrouve à éditer le même brouillon mondial !
    const provider = new WebrtcProvider(`topaze-notes-${noteId}`, ydoc);
    
    setSetup({ ydoc, provider });

    // 4. Ultra important : si je change de note, je dois détruire la connexion 
    // précédente, sinon mon navigateur va exploser avec trop de connexions ouvertes.
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
    />
  );
}

function EditorInner({ ydoc, initialContent, initialYjsState, onChange }: any) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Collaboration.configure({
        document: ydoc,
      }),
      Placeholder.configure({
        placeholder: 'Écris ta note ici (en temps réel)...',
      }),
    ],
    onUpdate: ({ editor }) => {
      // @ts-ignore
      const markdown = editor.storage.markdown.getMarkdown();
      
      // Ici c'est moi qui gère la conversion de l'état binaire de Yjs
      // en Base64 pour pouvoir le sauvegarder tranquillement dans Firestore
      // comme une simple chaîne de caractères !
      const stateUpdate = Y.encodeStateAsUpdate(ydoc);
      let binary = '';
      const len = stateUpdate.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(stateUpdate[i]);
      }
      const b64 = btoa(binary);
      
      // Je remonte les deux infos au parent (le composant KbView)
      onChange(markdown, b64);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none tiptap-editor',
      },
    },
  });

  // Cas particulier : si j'ouvre une note créée AVANT qu'on installe le système de collab,
  // elle n'a pas encore de yjsState. Dans ce cas, je force l'injection du vieux markdown 
  // dans l'éditeur pour ne pas perdre mes données !
  useEffect(() => {
    if (editor && !initialYjsState && initialContent && !editor.isDestroyed) {
      // @ts-ignore
      if (editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialYjsState, initialContent]);

  // Fallback de synchronisation Firestore !
  // Si le WebRTC (peer-to-peer) échoue à cause d'un pare-feu, on utilise Firestore
  // comme serveur de secours. Dès que Firestore m'envoie un nouvel état Yjs (sauvegardé 
  // par mon collègue), je l'applique directement sur mon document !
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
