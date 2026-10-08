import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import './TiptapEditor.css';

interface TiptapEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({
        placeholder: 'Écris ta note ici...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      // @ts-ignore
      onChange(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none tiptap-editor',
      },
    },
  });

  return (
    <div className="tiptap-wrapper">
      <EditorContent editor={editor} />
    </div>
  );
}
