import re

with open('src/pages/KbView.tsx', 'r') as f:
    content = f.read()

# 1. Sidebar Tooltips for Folder
folder_item_old = """className="folder-item\""""
folder_item_new = """className="folder-item" title={isOwner ? `Créé par : ${folder.authorEmail || 'Inconnu'}` : undefined}"""
content = content.replace(folder_item_old, folder_item_new)

# 2. Sidebar Tooltips for Note
note_item_old = """className={`note-item ${activeNote === note.id && !showGraph ? 'active' : ''}`}"""
note_item_new = """className={`note-item ${activeNote === note.id && !showGraph ? 'active' : ''}`} title={isOwner ? `Créé par : ${note.authorEmail || 'Inconnu'}` : undefined}"""
content = content.replace(note_item_old, note_item_new)

with open('src/pages/KbView.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
