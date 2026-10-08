import re

with open('src/components/TiptapEditor.tsx', 'r') as f:
    content = f.read()

# 1. Imports
imports = """import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import 'highlight.js/styles/atom-one-dark.css';

const lowlight = createLowlight(common);
"""
content = content.replace("import StarterKit from '@tiptap/starter-kit';", imports)

# 2. Extensions
extensions_old = """    extensions: [
      StarterKit,
      Markdown,"""

extensions_new = """    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Markdown,"""

content = content.replace(extensions_old, extensions_new)

with open('src/components/TiptapEditor.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
