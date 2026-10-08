import re

with open('src/pages/KbView.tsx', 'r') as f:
    content = f.read()

render_tree_func = """
  const renderTree = (parentId: string | null, depth: number = 0) => {
    const childFolders = folders.filter(f => (f.parentId || null) === parentId);
    const childNotes = notes.filter(n => n.folderId === parentId && (!activeTag || n.tags.split(',').map(t=>t.trim()).includes(activeTag)));

    return (
      <div style={{ marginLeft: depth > 0 ? '1rem' : '0' }}>
        {childFolders.map(folder => (
          <div key={folder.id}>
            <div 
              className="folder-item"
              draggable
              onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
              onClick={() => toggleFolder(folder.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                handleDrop(e, folder.id);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {expandedFolders[folder.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Folder size={16} fill="rgba(255,255,255,0.2)" />
                <span>{folder.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="add-note-btn" title="Ajouter un sous-dossier" onClick={(e) => { e.stopPropagation(); handleCreateFolder(folder.id); }}><FolderPlus size={14} /></button>
                <button className="add-note-btn" title="Ajouter une note" onClick={(e) => { e.stopPropagation(); handleAddNoteToFolder(folder.id); }}><Plus size={14} /></button>
                <button className="delete-note-btn" title="Supprimer le dossier" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}><Trash2 size={14} /></button>
              </div>
            </div>
            {expandedFolders[folder.id] && renderTree(folder.id, depth + 1)}
          </div>
        ))}
        
        {childNotes.map(note => (
          <div 
            key={note.id}
            draggable
            onDragStart={(e) => handleDragStart(e, note.id, 'note')}
            className={`note-item ${activeNote === note.id && !showGraph ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveNote(note.id); setShowGraph(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} />
              <span>{note.title}</span>
            </div>
            <button className="delete-note-btn" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    );
  };

"""

# Insert renderTree before `return (`
return_idx = content.find('  return (\n    <div className="kb-layout">')
content = content[:return_idx] + render_tree_func + content[return_idx:]

# Now replace the content of kb-sidebar-content
start_div = '<div \n          className="kb-sidebar-content"'
end_div_marker = '</div>\n      </aside>'

start_idx = content.find(start_div)
if start_idx == -1:
    print("Could not find kb-sidebar-content")
    exit(1)

# Find the matching closing div for aside
end_idx = content.find(end_div_marker, start_idx)

new_sidebar_content = """<div 
          className="kb-sidebar-content"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)} // Drop to root
        >
          {renderTree(null, 0)}
        </div>"""

content = content[:start_idx] + new_sidebar_content + '\n      </aside>' + content[end_idx + len(end_div_marker):]

with open('src/pages/KbView.tsx', 'w') as f:
    f.write(content)

print("Patch successful!")
