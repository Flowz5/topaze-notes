import re

with open('src/pages/KbView.tsx', 'r') as f:
    content = f.read()

# 1. Update Note and FolderType Interfaces
content = content.replace("parentId?: string | null;\n}", "parentId?: string | null;\n  authorEmail?: string;\n}")
content = content.replace("tags: string;\n  updatedAt?: Date;\n}", "tags: string;\n  updatedAt?: Date;\n  authorEmail?: string;\n}")

# 2. Update createFolder and createNote calls
create_folder_old = """await addDoc(collection(db, `knowledgeBases/${id}/folders`), {
          name: name.trim(),
          parentId,
          createdAt: serverTimestamp()
        });"""
create_folder_new = """await addDoc(collection(db, `knowledgeBases/${id}/folders`), {
          name: name.trim(),
          parentId,
          createdAt: serverTimestamp(),
          authorEmail: currentUser?.email || 'Inconnu'
        });"""
content = content.replace(create_folder_old, create_folder_new)

create_note_old = """const noteRef = await addDoc(collection(db, `knowledgeBases/${id}/notes`), {
        title: 'Nouvelle Note',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        folderId,
      });"""
create_note_new = """const noteRef = await addDoc(collection(db, `knowledgeBases/${id}/notes`), {
        title: 'Nouvelle Note',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        folderId,
        authorEmail: currentUser?.email || 'Inconnu'
      });"""
content = content.replace(create_note_old, create_note_new)

# 3. Update onSnapshot parsing
snapshot_folder_old = """parentId: doc.data().parentId || null,
        }));"""
snapshot_folder_new = """parentId: doc.data().parentId || null,
          authorEmail: doc.data().authorEmail || 'Inconnu'
        }));"""
content = content.replace(snapshot_folder_old, snapshot_folder_new)

snapshot_note_old = """tags: doc.data().tags || '',
          updatedAt: doc.data().updatedAt?.toDate()
        }));"""
snapshot_note_new = """tags: doc.data().tags || '',
          updatedAt: doc.data().updatedAt?.toDate(),
          authorEmail: doc.data().authorEmail || 'Inconnu'
        }));"""
content = content.replace(snapshot_note_old, snapshot_note_new)

# 4. Sidebar Title tooltips
render_folder_old = """<div 
            className="folder-header"
            onClick={() => toggleFolder(f.id)}"""
render_folder_new = """<div 
            className="folder-header"
            onClick={() => toggleFolder(f.id)}
            title={isOwner ? `Créé par : ${f.authorEmail || 'Inconnu'}` : undefined}"""
content = content.replace(render_folder_old, render_folder_new)

render_note_old = """<div 
                key={n.id} 
                className={`note-item ${activeNote === n.id ? 'active' : ''}`}
                onClick={() => setActiveNote(n.id)}"""
render_note_new = """<div 
                key={n.id} 
                className={`note-item ${activeNote === n.id ? 'active' : ''}`}
                onClick={() => setActiveNote(n.id)}
                title={isOwner ? `Créé par : ${n.authorEmail || 'Inconnu'}` : undefined}"""
content = content.replace(render_note_old, render_note_new)

# 5. Note Header metadata
meta_old = """<div className="meta-row">
                  <span className="meta-label">tags :</span>
                  <input 
                    type="text"
                    value={activeNoteData.tags}
                    onChange={(e) => updateActiveNote({ tags: e.target.value })}
                    placeholder="tag1, tag2..."
                    className="meta-input"
                  />
                </div>
              </div>
              <button 
                className="delete-note-btn"
                onClick={deleteActiveNote}
                title="Supprimer la note"
              >
                <Trash2 size={18} />
              </button>
            </div>"""
meta_new = """<div className="meta-row">
                  <span className="meta-label">tags :</span>
                  <input 
                    type="text"
                    value={activeNoteData.tags}
                    onChange={(e) => updateActiveNote({ tags: e.target.value })}
                    placeholder="tag1, tag2..."
                    className="meta-input"
                  />
                </div>
                {isOwner && (
                  <div className="meta-row" style={{ marginTop: '0.25rem' }}>
                    <span className="meta-label">créateur :</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{activeNoteData.authorEmail || 'Inconnu'}</span>
                  </div>
                )}
              </div>
              <button 
                className="delete-note-btn"
                onClick={deleteActiveNote}
                title="Supprimer la note"
              >
                <Trash2 size={18} />
              </button>
            </div>"""
content = content.replace(meta_old, meta_new)

with open('src/pages/KbView.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
