import re

with open('src/components/TiptapEditor.tsx', 'r') as f:
    content = f.read()

# 1. Imports
imports = """import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';"""
content = content.replace("import StarterKit from '@tiptap/starter-kit';", imports)

# 2. BubbleMenu Icons
icons = "import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, ListTodo } from 'lucide-react';"
content = content.replace("import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3 } from 'lucide-react';", icons)

# 3. Extensions
extensions_old = """    extensions: [
      StarterKit.configure({ codeBlock: false }),"""
extensions_new = """    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),"""
content = content.replace(extensions_old, extensions_new)

# 4. BubbleMenu JSX
bubble_menu_jsx = """          <div style={{ width: '1px', background: 'var(--border)', margin: '0.25rem' }}></div>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive('taskList') ? 'is-active' : ''}
            style={{ padding: '0.5rem', borderRadius: '50%', color: editor.isActive('taskList') ? 'var(--primary)' : 'white', background: editor.isActive('taskList') ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <ListTodo size={16} />
          </button>
          <div style={{ width: '1px', background: 'var(--border)', margin: '0.25rem' }}></div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}"""
content = content.replace("""          <div style={{ width: '1px', background: 'var(--border)', margin: '0.25rem' }}></div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}""", bubble_menu_jsx)

with open('src/components/TiptapEditor.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
