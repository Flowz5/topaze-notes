import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, 
  collection, addDoc, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  ArrowLeft, Plus, Share2, Network, 
  Folder, FileText, ChevronDown, ChevronRight, Settings, UserMinus, Trash2, Download, FolderPlus
} from 'lucide-react';
import TiptapEditor from '../components/TiptapEditor';
import ForceGraph2D from 'react-force-graph-2d';
import debounce from 'lodash/debounce';
import './KbView.css';

interface Note {
  id: string;
  title: string;
  folderId: string | null;
  content: string;
  yjsState?: string;
  date: string;
  tags: string;
}

interface FolderType {
  id: string;
  name: string;
}

export default function KbView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [baseData, setBaseData] = useState<{name: string, ownerId: string, members: string[]} | null>(null);
  
  // States
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeNote, setActiveNote] = useState<string | null>(null);
  
  const activeNoteData = notes.find(n => n.id === activeNote);

  // Debounced update for Firestore
  const debouncedUpdateNote = useCallback(
    debounce(async (noteId: string, kbId: string, updates: Partial<Note>) => {
      try {
        const noteRef = doc(db, `knowledgeBases/${kbId}/notes/${noteId}`);
        await updateDoc(noteRef, { ...updates, updatedAt: serverTimestamp() });
      } catch (err) {
        console.error("Erreur de sauvegarde:", err);
      }
    }, 1000, { maxWait: 2000 }), // Sauvegarde forcée toutes les 2s max même si on n'arrête pas de taper !
    []
  );

  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNote || !id) return;
    
    // Update local state immediately for fast UI
    setNotes(prev => prev.map(n => n.id === activeNote ? { ...n, ...updates } : n));
    
    // Send to Firestore with debounce
    debouncedUpdateNote(activeNote, id, updates);
  };

  // Graph View State
  const [showGraph, setShowGraph] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const mockGraphData = {
    nodes: [
      ...folders.map(f => ({ id: f.id, name: f.name, group: 'folder', val: 5 })),
      ...notes.map(n => ({ id: n.id, name: n.title, group: 'note', val: 3 })),
      ...Array.from(new Set(notes.flatMap(n => n.tags.split(',').map(t => t.trim()).filter(Boolean)))).map(tag => ({ id: `tag-${tag}`, name: `#${tag}`, group: 'tag', val: 4 }))
    ],
    links: [
      ...notes.filter(n => n.folderId).map(n => ({ source: n.folderId, target: n.id })),
      ...notes.flatMap(n => 
        n.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => ({ source: `tag-${tag}`, target: n.id }))
      ),
      // Backlinks graph links (with exact match to avoid substring issues like Note 1 vs Note 11)
      ...notes.flatMap(n => {
        const mentions = notes.filter(other => {
          if (n.id === other.id || !n.content) return false;
          // Look for @Title followed by non-word char or end of string
          const regex = new RegExp(`@${escapeRegExp(other.title)}(?![\\wÀ-ÿ])`, 'i');
          return regex.test(n.content);
        });
        return mentions.map(m => ({ source: n.id, target: m.id }));
      })
    ]
  };

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [tagSearch, setTagSearch] = useState('');

  const currentUser = auth.currentUser;
  const cursorColor = useMemo(() => '#' + Math.floor(Math.random()*16777215).toString(16), []);
  const isOwner = baseData?.ownerId === currentUser?.uid;

  // C'est ici que toute la magie de la synchronisation en temps réel opère !
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
        name: doc.data().name
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
      setNotes(notesData);
    }, console.error);

    return () => {
      unsubscribeBase();
      unsubscribeFolders();
      unsubscribeNotes();
    };
  }, [id]);

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

  const handleCreateFolder = async () => {
    if (!id) return;
    const name = window.prompt("Nom du nouveau dossier :");
    if (name && name.trim()) {
      try {
        await addDoc(collection(db, `knowledgeBases/${id}/folders`), {
          name: name.trim(),
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!id) return;
    if (window.confirm('Supprimer ce dossier et toutes les notes qu\'il contient ?')) {
      try {
        // Delete folder document
        await deleteDoc(doc(db, `knowledgeBases/${id}/folders/${folderId}`));
        
        // Delete all notes inside this folder
        const folderNotes = notes.filter(n => n.folderId === folderId);
        for (const note of folderNotes) {
          await deleteDoc(doc(db, `knowledgeBases/${id}/notes/${note.id}`));
        }
        
        if (activeNoteData?.folderId === folderId) {
          setActiveNote(null);
        }
      } catch (err) {
        console.error(err);
      }
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
        updatedAt: serverTimestamp()
      });
      setActiveNote(noteRef.id);
      setShowGraph(false);
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

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    if (!noteId || !id) return;

    try {
      const noteRef = doc(db, `knowledgeBases/${id}/notes/${noteId}`);
      await updateDoc(noteRef, { folderId, updatedAt: serverTimestamp() });
      if (folderId) setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('noteId', noteId);
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
        await deleteDoc(doc(db, 'knowledgeBases', id));
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
      <div className="kb-layout" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2>Base introuvable ou accès refusé</h2>
        <button className="btn-cancel" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  const rootNotes = notes.filter(n => n.folderId === null && (!activeTag || n.tags.split(',').map(t=>t.trim()).includes(activeTag)));

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags.split(',').map(t => t.trim()).filter(Boolean))));

  return (
    <div className="kb-layout">
      {/* SIDEBAR */}
      <aside className="kb-sidebar">
        
        <div className="kb-sidebar-header">
          <div className="kb-header-top">
            <button className="kb-back-btn" onClick={() => navigate('/')} title="Retour à l'accueil">
              <ArrowLeft size={20} />
            </button>
            <h1 className="kb-title" title={baseName}>{baseName}</h1>
          </div>
          
          <div className="kb-actions">
            <button className="kb-action-btn" onClick={() => createNoteInFirestore()} title="Nouvelle note">
              <Plus size={16} />
            </button>
            <button className="kb-action-btn" onClick={handleCreateFolder} title="Nouveau dossier">
              <FolderPlus size={16} />
            </button>
            <button 
              className="kb-action-btn" 
              title="Vue Graphe"
              onClick={() => setShowGraph(!showGraph)}
              style={{ backgroundColor: showGraph ? 'rgba(255,255,255,0.3)' : '' }}
            >
              <Network size={16} />
            </button>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="kb-tags-filter" style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: isTagsOpen ? '0.75rem' : '0' }}
              onClick={() => setIsTagsOpen(!isTagsOpen)}
            >
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Filtres par Tag ({allTags.length})
              </span>
              {isTagsOpen ? <ChevronDown size={14} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
            </div>
            
            {isTagsOpen && (
              <>
                <input 
                  type="text" 
                  placeholder="Rechercher un tag..." 
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: 'white',
                    fontSize: '0.85rem',
                    marginBottom: '0.75rem',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '150px', overflowY: 'auto' }}>
                  {allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => (
                    <span 
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor: activeTag === tag ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                        color: activeTag === tag ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: activeTag === tag ? '600' : '400',
                        border: '1px solid',
                        borderColor: activeTag === tag ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Aucun tag trouvé</span>
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
          {folders.map(folder => {
            const folderNotes = notes.filter(n => n.folderId === folder.id && (!activeTag || n.tags.split(',').map(t=>t.trim()).includes(activeTag)));
            return (
              <div key={folder.id}>
                <div 
                  className="folder-item" 
                  onClick={() => toggleFolder(folder.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    e.stopPropagation(); // Prevent dropping to root
                    handleDrop(e, folder.id);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {expandedFolders[folder.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Folder size={16} fill="rgba(255,255,255,0.2)" />
                    <span>{folder.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="add-note-btn" title="Ajouter une note" onClick={(e) => { e.stopPropagation(); handleAddNoteToFolder(folder.id); }}><Plus size={14} /></button>
                    <button className="delete-note-btn" title="Supprimer le dossier" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}><Trash2 size={14} /></button>
                  </div>
                </div>
                {expandedFolders[folder.id] && folderNotes.map(note => (
                  <div 
                    key={note.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, note.id)}
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
            )
          })}

          {rootNotes.map(note => (
            <div 
              key={note.id}
              draggable
              onDragStart={(e) => handleDragStart(e, note.id)}
              className={`folder-item ${activeNote === note.id && !showGraph ? 'active' : ''}`} 
              style={{ paddingLeft: '1.25rem', backgroundColor: activeNote === note.id && !showGraph ? 'rgba(255,255,255,0.1)' : '' }}
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
      </aside>

      {/* MAIN CONTENT */}
      <main className="kb-main">
        <header className="kb-main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {showGraph ? (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Vue Graphe (Bêta)</h2>
            ) : activeNoteData ? (
              <input 
                type="text" 
                value={activeNoteData.title} 
                onChange={(e) => updateActiveNote({ title: e.target.value })}
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white',
                  outline: 'none',
                  width: '100%'
                }} 
              />
            ) : (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>Aucune note sélectionnée</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {activeNoteData && !showGraph && (
              <button 
                className="export-btn" 
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
                Exporter
              </button>
            )}
            <button 
              className="logout-btn" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 size={16} />
              Partager
            </button>
            <button 
              className="logout-btn" 
              style={{ padding: '0.5rem', borderRadius: '50%' }}
              onClick={openSettings}
            >
              <Settings size={18} />
            </button>
          </div>
        </header>
        
        <div className="kb-main-content">
          {showGraph ? (
            <div ref={graphContainerRef} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.15)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              <ForceGraph2D
                width={graphDimensions.width}
                height={graphDimensions.height}
                graphData={mockGraphData}
                nodeLabel="name"
                nodeColor={(node: any) => {
                  if (node.group === 'folder') return '#ffffff';
                  if (node.group === 'tag') return 'rgba(255, 255, 255, 0.3)';
                  return '#5eead4';
                }}
                linkColor={() => 'rgba(255, 255, 255, 0.15)'}
                backgroundColor="transparent"
                onNodeClick={(node: any) => {
                  if (node.group === 'note') {
                    setActiveNote(node.id);
                    setShowGraph(false);
                  }
                }}
              />
            </div>
          ) : activeNoteData ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                onChange={(val, yjsState) => updateActiveNote({ content: val, yjsState })}
                allNotes={notes.map(n => ({ id: n.id, title: n.title }))}
                onNoteClick={setActiveNote}
              />
              
              {/* BACKLINKS SECTION */}
              <div className="backlinks-section" style={{ marginTop: '3rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Cité dans...</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {notes
                    .filter(n => n.id !== activeNoteData.id && n.content && n.content.includes(`@${activeNoteData.title}`))
                    .map(backlink => (
                      <button 
                        key={backlink.id}
                        className="backlink-pill"
                        onClick={() => setActiveNote(backlink.id)}
                        style={{
                          background: 'var(--surface-hover)',
                          border: '1px solid var(--border)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        {backlink.title}
                      </button>
                    ))
                  }
                  {notes.filter(n => n.id !== activeNoteData.id && n.content && n.content.includes(`@${activeNoteData.title}`)).length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Aucune mention.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="kb-empty-state">
              <Network size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.25rem' }}>Sélectionne une note ou ouvre la vue Graphe</p>
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
              <form onSubmit={handleInvite} style={{ marginBottom: '2rem' }}>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Adresse email de l'invité..."
                    className="home-input"
                    style={{ paddingLeft: '1.5rem' }}
                  />
                </div>
                <button type="submit" className="btn-confirm" style={{ width: '100%' }}>
                  Inviter
                </button>
              </form>
            ) : (
              <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Seul le propriétaire peut inviter de nouveaux membres.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                Membres ({baseData.members.length})
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {baseData.members.map((email) => (
                  <div key={email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                      {email} {email === currentUser?.email && <span style={{ opacity: 0.5 }}>(Toi)</span>}
                    </span>
                    {isOwner && email !== currentUser?.email && (
                      <button 
                        onClick={() => handleRemoveMember(email)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                        title="Retirer l'accès"
                      >
                        <UserMinus size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-cancel" onClick={() => setIsShareModalOpen(false)}>
                Fermer
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
                <form onSubmit={handleRename} style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    Renommer la base
                  </label>
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <input
                      type="text"
                      required
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      className="home-input"
                      style={{ paddingLeft: '1.5rem' }}
                    />
                  </div>
                  <button type="submit" className="btn-confirm" style={{ width: '100%' }}>
                    Enregistrer le nouveau nom
                  </button>
                </form>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                  <h4 style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 600 }}>Zone de danger</h4>
                  <button 
                    onClick={handleDeleteBase}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Supprimer la base
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
                  Tu es invité sur cette base. Tu ne peux pas modifier ses paramètres.
                </p>
                <button 
                  onClick={handleLeaveBase}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Quitter la base
                </button>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
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
