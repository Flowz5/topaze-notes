import re

with open('src/pages/KbView.tsx', 'r') as f:
    content = f.read()

# 1. createNoteInFirestore
note_old = """      const noteRef = await addDoc(collection(db, `knowledgeBases/${id}/notes`), {
        title: 'Nouvelle Note',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        folderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });"""
note_new = """      const noteRef = await addDoc(collection(db, `knowledgeBases/${id}/notes`), {
        title: 'Nouvelle Note',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        folderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authorEmail: auth.currentUser?.email || 'Inconnu'
      });"""
content = content.replace(note_old, note_new)

# 2. handleCreateFolder
folder_old = """          createdAt: serverTimestamp(),
          authorEmail: currentUser?.email || 'Inconnu'
        });"""
folder_new = """          createdAt: serverTimestamp(),
          authorEmail: auth.currentUser?.email || 'Inconnu'
        });"""
content = content.replace(folder_old, folder_new)


# 3. onSnapshot for folders
snap_folder_old = """          name: doc.data().name,
          parentId: doc.data().parentId || null,
        }));"""
snap_folder_new = """          name: doc.data().name,
          parentId: doc.data().parentId || null,
          authorEmail: doc.data().authorEmail || 'Inconnu'
        }));"""
content = content.replace(snap_folder_old, snap_folder_new)

# 4. onSnapshot for notes
snap_note_old = """          tags: doc.data().tags || '',
          updatedAt: doc.data().updatedAt?.toDate()
        }));"""
snap_note_new = """          tags: doc.data().tags || '',
          updatedAt: doc.data().updatedAt?.toDate(),
          authorEmail: doc.data().authorEmail || 'Inconnu'
        }));"""
content = content.replace(snap_note_old, snap_note_new)

with open('src/pages/KbView.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
