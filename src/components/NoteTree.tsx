import { memo } from 'react';
import type React from 'react';
import { ChevronDown, ChevronRight, Edit2, FileText, Folder, FolderPlus, Plus, Trash2 } from 'lucide-react';

export type TreeNote = { id: string; title: string; folderId: string | null; tags: string; authorEmail?: string };
export type TreeFolder = { id: string; name: string; parentId?: string | null; authorEmail?: string };

export type TreeActions = {
  openNote: (noteId: string) => void;
  toggleFolder: (folderId: string) => void;
  createFolder: (parentId: string | null) => void;
  renameFolder: (folderId: string, oldName: string) => void;
  addNoteToFolder: (folderId: string) => void;
  deleteFolder: (folderId: string) => void;
  deleteNote: (noteId: string) => void;
  dragStart: (e: React.DragEvent, id: string, type: 'note' | 'folder') => void;
  dragOver: (e: React.DragEvent) => void;
  drop: (e: React.DragEvent, folderId: string | null) => void;
};

type Props = {
  notes: TreeNote[];
  folders: TreeFolder[];
  expandedFolders: Record<string, boolean>;
  activeNoteId: string | null;
  activeTag: string | null;
  isOwner: boolean;
  actions: TreeActions;
};

const hasTag = (note: TreeNote, tag: string) => note.tags.split(',').map((t) => t.trim()).includes(tag);

/**
 * Arborescence dossiers / notes de la barre latérale.
 * Mémoïsée : elle ne se re-rend que si la structure change (titres, dossiers, tags...),
 * pas à chaque frappe dans l'éditeur.
 */
function NoteTree({ notes, folders, expandedFolders, activeNoteId, activeTag, isOwner, actions }: Props) {
  const renderLevel = (parentId: string | null, depth: number): React.ReactNode => {
    const childFolders = folders.filter((f) => (f.parentId || null) === parentId);
    const childNotes = notes.filter((n) => n.folderId === parentId && (!activeTag || hasTag(n, activeTag)));

    return (
      <div className={depth > 0 ? 'tree-children' : undefined}>
        {childFolders.map((folder) => (
          <div key={folder.id}>
            <div
              className="folder-item"
              title={isOwner ? `Créé par : ${folder.authorEmail || 'Inconnu'}` : undefined}
              draggable
              onDragStart={(e) => actions.dragStart(e, folder.id, 'folder')}
              onClick={() => actions.toggleFolder(folder.id)}
              onDragOver={actions.dragOver}
              onDrop={(e) => {
                e.stopPropagation();
                actions.drop(e, folder.id);
              }}
            >
              <div className="tree-item-label">
                {expandedFolders[folder.id] ? <ChevronDown size={14} className="tree-chevron" /> : <ChevronRight size={14} className="tree-chevron" />}
                <Folder size={16} className="folder-icon" />
                <span className="tree-item-name">{folder.name}</span>
              </div>
              <div className="tree-item-actions">
                <button className="add-note-btn" title="Ajouter un sous-dossier" onClick={(e) => { e.stopPropagation(); actions.createFolder(folder.id); }}><FolderPlus size={14} /></button>
                <button className="add-note-btn" title="Renommer le dossier" onClick={(e) => { e.stopPropagation(); actions.renameFolder(folder.id, folder.name); }}><Edit2 size={14} /></button>
                <button className="add-note-btn" title="Ajouter une note" onClick={(e) => { e.stopPropagation(); actions.addNoteToFolder(folder.id); }}><Plus size={14} /></button>
                <button className="delete-note-btn" title="Supprimer le dossier" onClick={(e) => { e.stopPropagation(); actions.deleteFolder(folder.id); }}><Trash2 size={14} /></button>
              </div>
            </div>
            {expandedFolders[folder.id] && renderLevel(folder.id, depth + 1)}
          </div>
        ))}

        {childNotes.map((note) => (
          <div
            key={note.id}
            draggable
            onDragStart={(e) => actions.dragStart(e, note.id, 'note')}
            className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
            title={isOwner ? `Créé par : ${note.authorEmail || 'Inconnu'}` : undefined}
            onClick={(e) => { e.stopPropagation(); actions.openNote(note.id); }}
          >
            <div className="tree-item-label">
              <FileText size={15} className="note-icon" />
              <span className="tree-item-name">{note.title}</span>
            </div>
            <button className="delete-note-btn" title="Supprimer la note" onClick={(e) => { e.stopPropagation(); actions.deleteNote(note.id); }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    );
  };

  return <>{renderLevel(null, 0)}</>;
}

export default memo(NoteTree);
