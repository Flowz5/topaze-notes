import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, 
  collection, addDoc, query, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { addYjsStateToBatch, deleteYjsState, YJS_MAX_CHUNKS } from '../lib/yjsStorage';
import { 
  ArrowLeft, Plus, Share2, Network, 
  FileText, ChevronDown, ChevronRight, Settings, UserMinus, Download, FolderPlus, Info, Search,
  Menu, X
} from 'lucide-react';
import TiptapEditor from '../components/TiptapEditor';
import NoteTree, { type TreeActions, type TreeNote } from '../components/NoteTree';
import ForceGraph2D from 'react-force-graph-2d';
import ThemeToggle from '../components/ThemeToggle';
import { usePendingEdits } from '../hooks/usePendingEdits';
import { useTheme } from '../theme/useTheme';
import { useDialogs } from '../components/dialogs/useDialogs';
import { userColor } from '../lib/userColor';
import { deleteKnowledgeBase } from '../lib/deleteKnowledgeBase';
import './KbView.css';

interface Note {
  id: string;
  title: string;
  folderId: string | null;
  content: string;
  /** Ancien format : état Yjs en base64 (migré vers la sous-collection yjs à la sauvegarde) */
  yjsState?: string;
  /** Local uniquement : état Yjs en attente de sauvegarde */
  yjs?: Uint8Array;
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
  // Nombre de morceaux Yjs connus par note (pour supprimer ceux en trop quand l'état rétrécit)
  const yjsChunkCountsRef = useRef<Record<string, number>>({});
  const saveNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    if (!id) return;
    const { yjs, ...fields } = updates;
    const batch = writeBatch(db);
    batch.update(doc(db, `knowledgeBases/${id}/notes/${noteId}`), { ...fields, updatedAt: serverTimestamp() });
    let chunkCount: number | undefined;
    if (yjs) {
      // Première sauvegarde de la session : on ne connaît pas l'existant, on nettoie tout
      const previous = yjsChunkCountsRef.current[noteId] ?? YJS_MAX_CHUNKS;
      chunkCount = addYjsStateToBatch(batch, db, id, noteId, yjs, previous);
    }
    await batch.commit();
    if (chunkCount !== undefined) yjsChunkCountsRef.current[noteId] = chunkCount;
  }, [id]);
  const { applyLocalEdit, mergeWithLocal } = usePendingEdits<Note>(saveNote);

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    if (!id) return;

    // Mise à jour locale immédiate pour une UI réactive
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n));

    applyLocalEdit(noteId, updates);
  };

  const updateActiveNote = (updates: Partial<Note>) => {
    if (activeNote) updateNote(activeNote, updates);
  };

  // Graph View State
  const [showGraph, setShowGraph] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });



  // Données du graphe : calculées seulement quand la vue Graphe est ouverte
  const graphData = useMemo(() => {
    if (!showGraph) return { nodes: [], links: [] };
    return {
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
  }, [showGraph, folders, notes]);

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
  const dialogs = useDialogs();

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
    const name = await dialogs.prompt({
      title: parentId ? 'Nouveau sous-dossier' : 'Nouveau dossier',
      label: 'Nom du dossier',
      placeholder: 'Ex : Réseaux',
      confirmLabel: 'Créer',
    });
    if (name) {
      try {
        await addDoc(collection(db, `knowledgeBases/${id}/folders`), {
          name,
          parentId,
          createdAt: serverTimestamp(),
          authorEmail: auth.currentUser?.email || 'Inconnu'
        });
        if (parentId) {
          setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
        }
      } catch (err) {
        console.error(err);
        dialogs.toast('Impossible de créer le dossier.', 'error');
      }
    }
  };

  const deleteFolderRecursive = async (fid: string) => {
    // Delete all notes inside this folder
    const folderNotes = notes.filter(n => n.folderId === fid);
    for (const note of folderNotes) {
      await deleteYjsState(db, id!, note.id);
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
    const folder = folders.find(f => f.id === folderId);
    const ok = await dialogs.confirm({
      title: `Supprimer « ${folder?.name ?? 'ce dossier'} » ?`,
      message: 'Le dossier, ses sous-dossiers et toutes les notes qu\'ils contiennent seront supprimés définitivement.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (ok) {
      try {
        await deleteFolderRecursive(folderId);
      } catch (err) {
        console.error(err);
        dialogs.toast('Impossible de supprimer le dossier.', 'error');
      }
    }
  };

  
  const handleRenameFolder = async (folderId: string, oldName: string) => {
    if (!id) return;
    const newName = await dialogs.prompt({
      title: 'Renommer le dossier',
      label: 'Nouveau nom',
      defaultValue: oldName,
      confirmLabel: 'Renommer',
    });
    if (!newName || newName === oldName) return;
    try {
      await updateDoc(doc(db, `knowledgeBases/${id}/folders`, folderId), { name: newName });
    } catch (err) {
      console.error(err);
      dialogs.toast('Impossible de renommer le dossier.', 'error');
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
      dialogs.toast('Impossible de créer la note.', 'error');
    }
  };

  const handleAddNoteToFolder = (folderId: string) => {
    createNoteInFirestore(folderId);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;
    const note = notes.find(n => n.id === noteId);
    const ok = await dialogs.confirm({
      title: `Supprimer « ${note?.title || 'cette note'} » ?`,
      message: 'Cette action est définitive.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (ok) {
      try {
        if (activeNote === noteId) setActiveNote(null);
        await deleteYjsState(db, id, noteId);
        await deleteDoc(doc(db, `knowledgeBases/${id}/notes/${noteId}`));
      } catch (err) {
        console.error(err);
        dialogs.toast('Impossible de supprimer la note.', 'error');
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
      console.error(err);
      dialogs.toast("Impossible d'inviter ce membre.", 'error');
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!id || !isOwner) return;
    if (email === currentUser?.email) return;
    try {
      const docRef = doc(db, 'knowledgeBases', id);
      await updateDoc(docRef, { members: arrayRemove(email) });
    } catch (err) {
      console.error(err);
      dialogs.toast('Impossible de retirer ce membre.', 'error');
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
      console.error(err);
      dialogs.toast('Impossible de renommer la base.', 'error');
    }
  };

  const handleDeleteBase = async () => {
    if (!id || !isOwner) return;
    const ok = await dialogs.confirm({
      title: `Supprimer « ${baseData?.name} » ?`,
      message: 'La base, ses dossiers et toutes ses notes seront supprimés définitivement, pour tous les membres.',
      confirmLabel: 'Supprimer la base',
      danger: true,
    });
    if (ok) {
      try {
        await deleteKnowledgeBase(db, id, currentUser!.uid);
        navigate('/');
      } catch (err) {
        console.error(err);
        dialogs.toast('Impossible de supprimer la base.', 'error');
      }
    }
  };

  const handleLeaveBase = async () => {
    if (!id || !currentUser?.email) return;
    const ok = await dialogs.confirm({
      title: `Quitter « ${baseData?.name} » ?`,
      message: "Tu n'y auras plus accès, sauf si le propriétaire t'invite à nouveau.",
      confirmLabel: 'Quitter la base',
      danger: true,
    });
    if (ok) {
      try {
        await updateDoc(doc(db, 'knowledgeBases', id), { members: arrayRemove(currentUser.email) });
        navigate('/');
      } catch (err) {
        console.error(err);
        dialogs.toast('Impossible de quitter la base.', 'error');
      }
    }
  };

  const baseName = baseData ? baseData.name : 'Chargement...';

  // --- Mémoïsation : une frappe dans l'éditeur ne doit pas re-rendre toute la page ---
  // Signature de la structure (sans le contenu) : change seulement si titre, dossier ou tags changent
  const structureKey = notes.map(n => `${n.id}\u0000${n.title}\u0000${n.folderId}\u0000${n.tags}\u0000${n.authorEmail ?? ''}`).join('\u0001');
  const treeNotes = useMemo<TreeNote[]>(
    () => notes.map(({ id, title, folderId, tags, authorEmail }) => ({ id, title, folderId, tags, authorEmail })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcul seulement si la structure change
    [structureKey]
  );
  const allTags = useMemo(
    () => Array.from(new Set(treeNotes.flatMap(n => n.tags.split(',').map(t => t.trim()).filter(Boolean)))),
    [treeNotes]
  );
  const editorNotes = useMemo(() => treeNotes.map(n => ({ id: n.id, title: n.title })), [treeNotes]);

  // Les handlers changent à chaque rendu : je passe des versions stables qui appellent toujours
  // la dernière version (sinon le mémo ne servirait à rien, ou on figerait des valeurs périmées).
  const latest = useRef({
    handleDragStart, handleDragOver, handleDrop, toggleFolder, handleCreateFolder, handleRenameFolder,
    handleAddNoteToFolder, handleDeleteFolder, handleDeleteNote, updateNote,
  });
  latest.current = {
    handleDragStart, handleDragOver, handleDrop, toggleFolder, handleCreateFolder, handleRenameFolder,
    handleAddNoteToFolder, handleDeleteFolder, handleDeleteNote, updateNote,
  };
  const treeActions = useMemo<TreeActions>(() => ({
    openNote: (noteId) => { setActiveNote(noteId); setShowGraph(false); setIsMobileSidebarOpen(false); },
    toggleFolder: (folderId) => latest.current.toggleFolder(folderId),
    createFolder: (parentId) => latest.current.handleCreateFolder(parentId),
    renameFolder: (folderId, oldName) => latest.current.handleRenameFolder(folderId, oldName),
    addNoteToFolder: (folderId) => latest.current.handleAddNoteToFolder(folderId),
    deleteFolder: (folderId) => latest.current.handleDeleteFolder(folderId),
    deleteNote: (noteId) => latest.current.handleDeleteNote(noteId),
    dragStart: (e, itemId, type) => latest.current.handleDragStart(e, itemId, type),
    dragOver: (e) => latest.current.handleDragOver(e),
    drop: (e, folderId) => latest.current.handleDrop(e, folderId),
  }), []);
  const onEditorChange = useCallback(
    (noteId: string, content: string, yjs: Uint8Array, mentions: string[]) => latest.current.updateNote(noteId, { content, yjs, mentions }),
    []
  );
  const onEditorNoteClick = useCallback((noteId: string) => {
    setActiveNote(noteId);
    setIsMobileSidebarOpen(false);
  }, []);
  const editorUser = useMemo(
    () => ({ name: currentUser?.email?.split('@')[0] || 'Anonyme', color: userColor(currentUser?.email) }),
    [currentUser?.email]
  );

  if (baseData === null) {
    return (
      <div className="kb-layout kb-not-found">
        <h2>Base introuvable ou accès refusé</h2>
        <button className="btn-cancel" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  



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
          <NoteTree
            notes={treeNotes}
            folders={folders}
            expandedFolders={expandedFolders}
            activeNoteId={showGraph ? null : activeNote}
            activeTag={activeTag}
            isOwner={isOwner}
            actions={treeActions}
          />
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
                graphData={graphData}
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
                kbId={id!}
                noteId={activeNoteData.id}
                initialContent={activeNoteData.content}
                legacyYjsState={activeNoteData.yjsState}
                currentUser={editorUser}
                onChange={onEditorChange}
                allNotes={editorNotes}
                onNoteClick={onEditorNoteClick}
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
