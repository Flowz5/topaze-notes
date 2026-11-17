import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, 
  collection, addDoc, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  ArrowLeft, Plus, Share2, Network, 
  Folder, FileText, ChevronDown, ChevronRight, Settings, UserMinus, Trash2, Edit2, Download, FolderPlus, Info, Search,
  Menu, X
} from 'lucide-react';
import TiptapEditor from '../components/TiptapEditor';
import ForceGraph2D from 'react-force-graph-2d';
import ThemeToggle from '../components/ThemeToggle';
import { usePendingEdits } from '../hooks/usePendingEdits';
import { useTheme } from '../theme/useTheme';
import { deleteKnowledgeBase } from '../lib/deleteKnowledgeBase';
import './KbView.css';

interface Note {
  id: string;
  title: string;
  folderId: string | null;
  content: string;
  yjsState?: string;
  date: string;
  tags: string;
  updatedAt?: Date;
  authorEmail?: string;
  mentions?: string[];
}

interface FolderType {
  id: string;
  name: string;
  parentId?: string | null;
  authorEmail?: string;
}


const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function KbView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [baseData, setBaseData] = useState<{name: string, ownerId: string, members: string[]} | null>(null);
  
  // States
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const activeNoteData = notes.find(n => n.id === activeNote);

  // Sauvegarde Firestore : les modifs locales sont cumulées puis envoyées (1s après la
  // dernière frappe, et au moins toutes les 2s). Tant que Firestore ne les a pas confirmées,
  // elles restent prioritaires sur les snapshots, sinon des lettres tapées "sautent".
  const saveNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    if (!id) return;
    const noteRef = doc(db, `knowledgeBases/${id}/notes/${noteId}`);
    await updateDoc(noteRef, { ...updates, updatedAt: serverTimestamp() });
  }, [id]);
  const { applyLocalEdit, mergeWithLocal } = usePendingEdits<Note>(saveNote);

  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNote || !id) return;

    // Mise à jour locale immédiate pour une UI réactive
    setNotes(prev => prev.map(n => n.id === activeNote ? { ...n, ...updates } : n));

    applyLocalEdit(activeNote, updates);
  };

  // Graph View State
  const [showGraph, setShowGraph] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });



  const mockGraphData = {
    nodes: [
      ...folders.map(f => ({ id: f.id, name: f.name, group: 'folder', val: 5 })),
      ...notes.map(n => ({ id: n.id, name: n.title, group: 'note', val: 3 })),
      ...Array.from(new Set(notes.flatMap(n => n.tags.split(',').map(t => t.trim()).filter(Boolean)))).map(tag => ({ id: `tag-${tag}`, name: `#${tag}`, group: 'tag', val: 4 }))
    ],
    links: [
      ...folders.filter(f => f.parentId).map(f => ({ source: f.parentId, target: f.id })),
      ...notes.filter(n => n.folderId).map(n => ({ source: n.folderId, target: n.id })),
      ...notes.flatMap(n => 
        n.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => ({ source: `tag-${tag}`, target: n.id }))
      ),
      // Backlinks graph links (with exact match to avoid substring issues like Note 1 vs Note 11)
      ...notes.flatMap(n => {
        const mentions = notes.filter(other => n.mentions?.includes(other.id));
        return mentions.map(m => ({ source: n.id, target: m.id }));
      })
    ]
  };

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [renameInput, setRenameInput] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [tagSearch, setTagSearch] = useState('');

  const currentUser = auth.currentUser;
  const { theme } = useTheme();

  // Le graphe est dessiné dans un canvas : je lis les couleurs du thème courant
  // directement depuis les variables CSS pour qu'il suive le mode clair/sombre.
  const graphColors = useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    return {
      note: v('--graph-note'),
      folder: v('--graph-folder'),
      tag: v('--graph-tag'),
      link: v('--graph-link'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcul voulu à chaque changement de thème
  }, [theme]);
  const cursorColor = useMemo(() => '#' + Math.floor(Math.random()*16777215).toString(16), []);
  const isOwner = baseData?.ownerId === currentUser?.uid;

  // C'est ici que toute la magie de la synchronisation en temps réel opère !
  // Je charge les notes et dossiers de la base de connaissances.
  useEffect(() => {
    if (!id) return;

    // Je commence par écouter les infos globales de la base (nom, proprio...)
    const docRef = doc(db, 'knowledgeBases', id);
    const unsubscribeBase = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setBaseData({
          name: docSnap.data().name,
          ownerId: docSnap.data().ownerId,
          members: docSnap.data().members || []
        });
      } else {
        setBaseData(null);
      }
    }, console.error);

    // Listen to Folders
    const foldersRef = collection(db, `knowledgeBases/${id}/folders`);
    const qFolders = query(foldersRef, orderBy('createdAt', 'asc'));
    const unsubscribeFolders = onSnapshot(qFolders, (snapshot) => {
      const foldersData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        parentId: doc.data().parentId || null,
        authorEmail: doc.data().authorEmail
      })) as FolderType[];
      setFolders(foldersData);
      
      // Auto-expand all new folders
      setExpandedFolders(prev => {
        const newExpanded = { ...prev };
        foldersData.forEach(f => {
          if (newExpanded[f.id] === undefined) newExpanded[f.id] = true;
        });
        return newExpanded;
      });
    }, console.error);

    // Listen to Notes
    const notesRef = collection(db, `knowledgeBases/${id}/notes`);
    const qNotes = query(notesRef, orderBy('createdAt', 'asc'));
    const unsubscribeNotes = onSnapshot(qNotes, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(mergeWithLocal(notesData));
    }, console.error);

    return () => {
      unsubscribeBase();
      unsubscribeFolders();
      unsubscribeNotes();
    };
  }, [id, mergeWithLocal]);

  useEffect(() => {
    if (showGraph && graphContainerRef.current) {
      const updateDimensions = () => {
        if (graphContainerRef.current) {
          setGraphDimensions({
            width: graphContainerRef.current.clientWidth,
            height: graphContainerRef.current.clientHeight
          });
        }
      };
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [showGraph]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateFolder = async (parentId: string | null = null) => {
    if (!id) return;
    const name = window.prompt("Nom du nouveau dossier :");
    if (name && name.trim()) {
      try {
        await addDoc(collection(db, `knowledgeBases/${id}/folders`), {
          name: name.trim(),
          parentId,
          createdAt: serverTimestamp(),
          authorEmail: auth.currentUser?.email || 'Inconnu'
        });
        if (parentId) {
          setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteFolderRecursive = async (fid: string) => {
    // Delete all notes inside this folder
    const folderNotes = notes.filter(n => n.folderId === fid);
    for (const note of folderNotes) {
      await deleteDoc(doc(db, `knowledgeBases/${id}/notes/${note.id}`));
      if (activeNote === note.id) setActiveNote(null);
    }
    // Find all sub-folders and delete them recursively
    const subFolders = folders.filter(f => f.parentId === fid);
    for (const sub of subFolders) {
      await deleteFolderRecursive(sub.id);
    }
    // Delete the folder itself
    await deleteDoc(doc(db, `knowledgeBases/${id}/folders/${fid}`));
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!id) return;
    if (window.confirm('Supprimer ce dossier et toutes les notes/sous-dossiers qu\'il contient ?')) {
      try {
        await deleteFolderRecursive(folderId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  
  const handleRenameFolder = async (folderId: string, oldName: string) => {
    if (!id) return;
    const newName = window.prompt('Nouveau nom du dossier :', oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    try {
      await updateDoc(doc(db, `knowledgeBases/${id}/folders`, folderId), { name: newName.trim() });
    } catch (err) {
      console.error(err);
      alert('Erreur lors du renommage du dossier.');
    }
  };

  const createNoteInFirestore = async (folderId: string | null = null) => {
    if (!id) return;
    try {
      const noteRef = await addDoc(collection(db, `knowledgeBases/${id}/notes`), {
        title: 'Nouvelle Note',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        folderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authorEmail: auth.currentUser?.email || 'Inconnu'
      });
      setActiveNote(noteRef.id);
      setShowGraph(false);
      setIsMobileSidebarOpen(false);
      if (folderId) setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNoteToFolder = (folderId: string) => {
    createNoteInFirestore(folderId);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;
    if (window.confirm('Supprimer cette note ?')) {
      try {
        await deleteDoc(doc(db, `knowledgeBases/${id}/notes/${noteId}`));
        if (activeNote === noteId) setActiveNote(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dragType = e.dataTransfer.getData('dragType');
    const draggedId = e.dataTransfer.getData('draggedId');
    if (!draggedId || !id) return;
    
    // Prevent dropping a folder into itself
    if (dragType === 'folder' && draggedId === targetFolderId) return;

    try {
      if (dragType === 'note') {
        const noteRef = doc(db, `knowledgeBases/${id}/notes/${draggedId}`);
        await updateDoc(noteRef, { folderId: targetFolderId, updatedAt: serverTimestamp() });
      } else if (dragType === 'folder') {
        const folderRef = doc(db, `knowledgeBases/${id}/folders/${draggedId}`);
        await updateDoc(folderRef, { parentId: targetFolderId });
      }
      
      if (targetFolderId) setExpandedFolders(prev => ({ ...prev, [targetFolderId]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, draggedId: string, dragType: 'note' | 'folder') => {
    e.stopPropagation();
    e.dataTransfer.setData('dragType', dragType);
    e.dataTransfer.setData('draggedId', draggedId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };


  
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !id || !isOwner) return;
    try {
      const docRef = doc(db, 'knowledgeBases', id);
      await updateDoc(docRef, { members: arrayUnion(inviteEmail.trim().toLowerCase()) });
      setInviteEmail('');
    } catch (err) {
      alert("Erreur lors de l'invitation.");
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!id || !isOwner) return;
    if (email === currentUser?.email) return;
    try {
      const docRef = doc(db, 'knowledgeBases', id);
      await updateDoc(docRef, { members: arrayRemove(email) });
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const openSettings = () => {
    if (baseData) setRenameInput(baseData.name);
    setIsSettingsModalOpen(true);
  };

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !isOwner || !renameInput.trim()) return;
    try {
      await updateDoc(doc(db, 'knowledgeBases', id), { name: renameInput.trim() });
      setIsSettingsModalOpen(false);
    } catch (err) {
      alert("Erreur lors du renommage.");
    }
  };

  const handleDeleteBase = async () => {
    if (!id || !isOwner) return;
    if (window.confirm("Es-tu sûr de vouloir supprimer définitivement cette base ?")) {
      try {
        await deleteKnowledgeBase(db, id, currentUser!.uid);
        navigate('/');
      } catch (err) {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleLeaveBase = async () => {
    if (!id || !currentUser?.email) return;
    if (window.confirm("Es-tu sûr de vouloir quitter cette base ?")) {
      try {
        await updateDoc(doc(db, 'knowledgeBases', id), { members: arrayRemove(currentUser.email) });
        navigate('/');
      } catch (err) {
        alert("Erreur en quittant la base.");
      }
    }
  };

  const baseName = baseData ? baseData.name : 'Chargement...';

  if (baseData === null) {
    return (
      <div className="kb-layout kb-not-found">
        <h2>Base introuvable ou accès refusé</h2>
        <button className="btn-cancel" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags.split(',').map(t => t.trim()).filter(Boolean))));


  const renderTree = (parentId: string | null, depth: number = 0) => {
    const childFolders = folders.filter(f => (f.parentId || null) === parentId);
    const childNotes = notes.filter(n => n.folderId === parentId && (!activeTag || n.tags.split(',').map(t=>t.trim()).includes(activeTag)));

    return (
      <div className={depth > 0 ? 'tree-children' : undefined}>
        {childFolders.map(folder => (
          <div key={folder.id}>
            <div 
              className="folder-item" title={isOwner ? `Créé par : ${folder.authorEmail || 'Inconnu'}` : undefined}
              draggable
              onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
              onClick={() => toggleFolder(folder.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                handleDrop(e, folder.id);
              }}
            >
              <div className="tree-item-label">
                {expandedFolders[folder.id] ? <ChevronDown size={14} className="tree-chevron" /> : <ChevronRight size={14} className="tree-chevron" />}
                <Folder size={16} className="folder-icon" />
                <span className="tree-item-name">{folder.name}</span>
              </div>
              <div className="tree-item-actions">
                <button className="add-note-btn" title="Ajouter un sous-dossier" onClick={(e) => { e.stopPropagation(); handleCreateFolder(folder.id); }}><FolderPlus size={14} /></button>
                <button className="add-note-btn" title="Renommer le dossier" onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder.id, folder.name); }}><Edit2 size={14} /></button>
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
            className={`note-item ${activeNote === note.id && !showGraph ? 'active' : ''}`} title={isOwner ? `Créé par : ${note.authorEmail || 'Inconnu'}` : undefined}
            onClick={(e) => { e.stopPropagation(); setActiveNote(note.id); setShowGraph(false); setIsMobileSidebarOpen(false); }}
          >
            <div className="tree-item-label">
              <FileText size={15} className="note-icon" />
              <span className="tree-item-name">{note.title}</span>
            </div>
            <button className="delete-note-btn" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="kb-layout">
      {/* MOBILE BACKDROP */}
      {isMobileSidebarOpen && (
        <div 
          className="kb-mobile-backdrop" 
          onClick={() => setIsMobileSidebarOpen(false)} 
        />
      )}

      {/* SIDEBAR */}
      <aside className={`kb-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        
        <div className="kb-sidebar-header">
          <div className="kb-header-top">
            <button className="kb-back-btn" onClick={() => navigate('/')} title="Retour à l'accueil">
              <ArrowLeft size={20} />
            </button>
            <h1 className="kb-title" title={baseName}>{baseName}</h1>
            <button 
              className="kb-mobile-close-btn" 
              onClick={() => setIsMobileSidebarOpen(false)} 
              title="Fermer le menu"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="kb-actions">
            <button className="kb-action-btn" onClick={() => createNoteInFirestore()} title="Nouvelle note">
              <Plus size={16} />
              <span>Note</span>
            </button>
            <button className="kb-action-btn" onClick={() => handleCreateFolder(null)} title="Nouveau dossier">
              <FolderPlus size={16} />
              <span>Dossier</span>
            </button>
            <button 
              className={`kb-action-btn ${showGraph ? 'is-active' : ''}`}
              title="Vue Graphe"
              onClick={() => setShowGraph(!showGraph)}
            >
              <Network size={16} />
              <span>Graphe</span>
            </button>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="kb-tags-filter">
            <button
              type="button"
              className={`kb-tags-toggle ${isTagsOpen ? 'is-open' : ''}`}
              onClick={() => setIsTagsOpen(!isTagsOpen)}
            >
              <span>Tags <span className="kb-tags-count">{allTags.length}</span></span>
              {isTagsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {isTagsOpen && (
              <>
                <input 
                  type="text" 
                  placeholder="Rechercher un tag..." 
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="input input-sm kb-tags-search"
                />
                <div className="kb-tags-list">
                  {allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => (
                    <span 
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`tag-chip ${activeTag === tag ? 'is-active' : ''}`}
                    >
                      #{tag}
                    </span>
                  ))}
                  {allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                    <span className="muted-hint">Aucun tag trouvé</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        <div 
          className="kb-sidebar-content"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)} // Drop to root
        >
          {renderTree(null, 0)}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="kb-main">
        <header className="kb-main-header">
          <div className="kb-header-title-container">
            <button 
              className="kb-mobile-menu-btn" 
              onClick={() => setIsMobileSidebarOpen(true)} 
              title="Ouvrir les dossiers"
            >
              <Menu size={20} />
            </button>
            {showGraph ? (
              <h2 className="kb-header-title-text">Vue Graphe</h2>
            ) : activeNoteData ? (
              <input 
                type="text" 
                value={activeNoteData.title} 
                onChange={(e) => updateActiveNote({ title: e.target.value })}
                className="kb-header-title-input"
              />
            ) : (
              <h2 className="kb-header-title-empty">Aucune note sélectionnée</h2>
            )}
          </div>
          <div className="kb-header-actions-container">
            {activeNoteData && !showGraph && (
              <button 
                className="export-btn kb-header-btn" 
                onClick={() => {
                  const yaml = `---\ntitle: ${activeNoteData.title}\ndate: ${activeNoteData.date}\ntags: [${activeNoteData.tags}]\n---\n\n`;
                  const fullContent = yaml + activeNoteData.content;
                  const blob = new Blob([fullContent], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${activeNoteData.title.replace(/\s+/g, '-').toLowerCase()}.md`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                title="Exporter en Markdown"
              >
                <Download size={16} />
                <span className="btn-text">Exporter</span>
              </button>
            )}
            <button 
              className="logout-btn kb-header-btn" 
              onClick={() => setIsShareModalOpen(true)}
              title="Partager"
            >
              <Share2 size={16} />
              <span className="btn-text">Partager</span>
            </button>
            <ThemeToggle className="kb-header-icon-btn" />
            <button 
              className="icon-btn kb-header-icon-btn" 
              onClick={() => setIsSearchModalOpen(true)}
              title="Rechercher (Cmd+K)"
            >
              <Search size={18} />
            </button>
            <button 
              className="icon-btn kb-header-icon-btn" 
              onClick={() => setIsHelpModalOpen(true)}
              title="Aide & Raccourcis"
            >
              <Info size={18} />
            </button>
            <button 
              className="icon-btn kb-header-icon-btn" 
              onClick={openSettings}
              title="Paramètres"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>
        
        <div className="kb-main-content">
          {showGraph ? (
            <div ref={graphContainerRef} className="kb-graph">
              <ForceGraph2D
                width={graphDimensions.width}
                height={graphDimensions.height}
                graphData={mockGraphData}
                nodeLabel="name"
                nodeColor={(node: any) => {
                  if (node.group === 'folder') return graphColors.folder;
                  if (node.group === 'tag') return graphColors.tag;
                  return graphColors.note;
                }}
                linkColor={() => graphColors.link}
                backgroundColor="transparent"
                onNodeClick={(node: any) => {
                  if (node.group === 'note') {
                    setActiveNote(node.id);
                    setShowGraph(false);
                    setIsMobileSidebarOpen(false);
                  }
                }}
              />
            </div>
          ) : activeNoteData ? (
            <div className="kb-note">
              <div className="kb-note-properties">
                <div className="prop-row">
                  <span className="prop-key">date:</span>
                  <input 
                    type="date" 
                    className="prop-val" 
                    value={activeNoteData.date} 
                    onChange={e => updateActiveNote({ date: e.target.value })}
                  />
                </div>
                <div className="prop-row">
                  <span className="prop-key">tags:</span>
                  <input 
                    type="text" 
                    className="prop-val" 
                    placeholder="tag1, tag2..."
                    value={activeNoteData.tags} 
                    onChange={e => updateActiveNote({ tags: e.target.value })}
                  />
                </div>
              </div>
              <TiptapEditor
                key={activeNoteData.id}
                noteId={activeNoteData.id}
                initialContent={activeNoteData.content}
                initialYjsState={activeNoteData.yjsState}
                currentUser={{ name: currentUser?.email?.split('@')[0] || 'Anonyme', color: cursorColor }}
                onChange={(val, yjsState, mentions) => updateActiveNote({ content: val, yjsState, mentions })}
                allNotes={notes.map(n => ({ id: n.id, title: n.title }))}
                onNoteClick={(noteId) => {
                  setActiveNote(noteId);
                  setIsMobileSidebarOpen(false);
                }}
              />
              
              {/* BACKLINKS SECTION */}
              <div className="backlinks-section">
                <h3 className="backlinks-title">Cité dans</h3>
                <div className="backlinks-list">
                  {notes
                    .filter(n => n.id !== activeNoteData.id && n.mentions?.includes(activeNoteData.id))
                    .map(backlink => (
                      <button 
                        key={backlink.id}
                        className="backlink-pill"
                        onClick={() => {
                          setActiveNote(backlink.id);
                          setIsMobileSidebarOpen(false);
                        }}
                      >
                        <FileText size={13} />
                        {backlink.title}
                      </button>
                    ))
                  }
                  {notes.filter(n => n.id !== activeNoteData.id && n.mentions?.includes(activeNoteData.id)).length === 0 && (
                    <span className="muted-hint">Aucune mention.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="kb-empty-state">
              <div className="kb-empty-icon">
                <Network size={32} />
              </div>
              <p className="kb-empty-title">Aucune note ouverte</p>
              <p className="kb-empty-text">Sélectionne une note dans la barre latérale, crée-en une nouvelle ou explore la vue Graphe.</p>
              <div className="kb-empty-actions">
                <button className="btn btn-primary" onClick={() => createNoteInFirestore()}>
                  <Plus size={16} /> Nouvelle note
                </button>
                <button className="btn btn-secondary" onClick={() => setShowGraph(true)}>
                  <Network size={16} /> Vue Graphe
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PARTAGE */}
      {isShareModalOpen && baseData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Gérer les accès</h3>
            
            {isOwner ? (
              <form onSubmit={handleInvite} className="share-form">
                <div className="field">
                  <span className="field-icon"><Share2 size={16} /></span>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Adresse email de l'invité..."
                    className="input"
                  />
                </div>
                <button type="submit" className="btn-confirm">
                  Inviter
                </button>
              </form>
            ) : (
              <p className="modal-text" style={{ marginBottom: '1.5rem' }}>
                Seul le propriétaire peut inviter de nouveaux membres.
              </p>
            )}

            <div>
              <h4 className="modal-section-title">
                Membres · {baseData.members.length}
              </h4>
              <div className="member-list">
                {baseData.members.map((email) => (
                  <div key={email} className="member-row">
                    <span className="member-avatar">{email.charAt(0).toUpperCase()}</span>
                    <span className="member-email">
                      {email} {email === currentUser?.email && <span className="member-you">(Toi)</span>}
                    </span>
                    {isOwner && email !== currentUser?.email && (
                      <button 
                        onClick={() => handleRemoveMember(email)}
                        className="member-remove"
                        title="Retirer l'accès"
                      >
                        <UserMinus size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsShareModalOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      
      
      {/* MODAL RECHERCHE GLOBALE */}
      {isSearchModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSearchModalOpen(false)}>
          <div className="modal-content modal-wide search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-bar">
              <Search size={20} className="search-bar-icon" />
              <input
                autoFocus
                type="text"
                placeholder="Rechercher une note par titre..."
                value={globalSearchInput}
                onChange={e => setGlobalSearchInput(e.target.value)}
                className="search-bar-input"
              />
              <kbd>Esc</kbd>
            </div>
            
            <div className="search-results">
              {(() => {
                const searchLower = globalSearchInput.toLowerCase();
                const filteredNotes = notes.filter(n => {
                  const titleMatch = n.title.toLowerCase().includes(searchLower);
                  const contentMatch = stripHtml(n.content).toLowerCase().includes(searchLower);
                  return titleMatch || contentMatch;
                });

                if (filteredNotes.length === 0) {
                  return (
                    <div className="search-empty">
                      Aucune note ne correspond à "{globalSearchInput}"
                    </div>
                  );
                }

                return filteredNotes.map(note => {
                  const plainContent = stripHtml(note.content);
                  const contentIndex = plainContent.toLowerCase().indexOf(searchLower);
                  
                  let snippet = null;
                  if (contentIndex !== -1 && !note.title.toLowerCase().includes(searchLower)) {
                    const start = Math.max(0, contentIndex - 30);
                    const end = Math.min(plainContent.length, contentIndex + searchLower.length + 30);
                    snippet = (start > 0 ? "..." : "") + plainContent.substring(start, end) + (end < plainContent.length ? "..." : "");
                  }

                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setActiveNote(note.id);
                        setIsSearchModalOpen(false);
                        setGlobalSearchInput('');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="search-result"
                    >
                      <div className="search-result-title">
                        <FileText size={16} />
                        <span>{note.title}</span>
                      </div>
                      {snippet && (
                        <div className="search-result-snippet">
                          "{snippet}"
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AIDE / INFO */}
      {isHelpModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-wide">
            <h3 className="modal-title">Bienvenue sur Topaze Notes</h3>
            <div className="modal-text">
              <p style={{ marginBottom: '1rem' }}>Voici quelques astuces pour utiliser l'application comme un pro :</p>
              
              <ul className="help-list">
                <li className="help-item">
                  <strong>Liens Bidirectionnels (Backlinks)</strong>
                  Tape <kbd>@</kbd> n'importe où dans tes notes pour faire le lien vers une autre note. Le graphe se mettra à jour automatiquement !
                </li>
                <li className="help-item">
                  <strong>Recherche Globale</strong>
                  Appuie sur <kbd>Cmd + K</kbd> ou <kbd>Ctrl + K</kbd> depuis n'importe où pour ouvrir la barre de recherche rapide et naviguer entre tes notes.
                </li>
                <li className="help-item">
                  <strong>Syntaxe Markdown</strong>
                  L'éditeur supporte la syntaxe Markdown standard : <b>gras</b> avec <kbd>**</kbd>, <i>italique</i> avec <kbd>*</kbd>, titres avec <kbd>#</kbd>, blocs de code avec <kbd>```</kbd>, et listes de tâches avec <kbd>[ ]</kbd>.
                </li>
                <li className="help-item">
                  <strong>Organisation</strong>
                  Tu peux glisser et déposer (Drag & Drop) tes notes et tes dossiers dans la barre latérale pour tout organiser à l'infini.
                </li>
              </ul>
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsHelpModalOpen(false)}>
                J'ai compris !
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARAMÈTRES */}
      {isSettingsModalOpen && baseData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Paramètres</h3>
            
            {isOwner ? (
              <>
                <form onSubmit={handleRename} className="share-form">
                  <label className="field-label" htmlFor="rename-base">
                    Renommer la base
                  </label>
                  <div className="field">
                    <input
                      id="rename-base"
                      type="text"
                      required
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      className="input"
                    />
                  </div>
                  <button type="submit" className="btn-confirm">
                    Enregistrer le nouveau nom
                  </button>
                </form>

                <div className="modal-section">
                  <h4 className="modal-section-title is-danger">Zone de danger</h4>
                  <button 
                    onClick={handleDeleteBase}
                    className="btn btn-danger"
                  >
                    Supprimer la base
                  </button>
                </div>
              </>
            ) : (
              <div>
                <p className="modal-text" style={{ marginBottom: '1.25rem' }}>
                  Tu es invité sur cette base. Tu ne peux pas modifier ses paramètres.
                </p>
                <button 
                  onClick={handleLeaveBase}
                  className="btn btn-danger"
                >
                  Quitter la base
                </button>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsSettingsModalOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
