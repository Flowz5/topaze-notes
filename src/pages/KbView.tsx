import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { 
  ArrowLeft, Plus, Share2, Network, 
  Folder, FileText, ChevronDown, ChevronRight, Settings, UserMinus 
} from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import ForceGraph2D from 'react-force-graph-2d';
import './KbView.css';

export default function KbView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [baseData, setBaseData] = useState<{name: string, ownerId: string, members: string[]} | null>(null);
  
  // Mock d'une arborescence pour la démo
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'folder-1': true,
  });
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // Markdown Editor State
  const [markdownContent, setMarkdownContent] = useState<string>('# Bienvenue dans ta note\n\nCommence à écrire en **Markdown** ici !\n\n- Liste 1\n- Liste 2\n\n```js\nconsole.log("Hello Topaze !");\n```');

  // Graph View State
  const [showGraph, setShowGraph] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });

  // Mock Graph Data
  const mockGraphData = {
    nodes: [
      { id: 'folder-1', name: 'Cours Magistraux', group: 'folder', val: 5 },
      { id: 'note-1', name: 'Introduction au réseau', group: 'note', val: 3 },
      { id: 'note-2', name: 'Modèle OSI', group: 'note', val: 3 },
      { id: 'folder-2', name: 'Projets Pratiques', group: 'folder', val: 5 },
      { id: 'note-3', name: 'Configuration Switch Cisco', group: 'note', val: 3 },
      { id: 'note-4', name: 'Lexique réseau', group: 'note', val: 3 },
      { id: 'tag-1', name: '#réseau', group: 'tag', val: 4 },
    ],
    links: [
      { source: 'folder-1', target: 'note-1' },
      { source: 'folder-1', target: 'note-2' },
      { source: 'folder-2', target: 'note-3' },
      { source: 'note-1', target: 'note-2' }, // Lien interne (Note 1 link to Note 2)
      { source: 'note-3', target: 'note-1' }, // Lien interne
      { source: 'tag-1', target: 'note-1' },
      { source: 'tag-1', target: 'note-4' },
    ]
  };

  // Modal Partage
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Modal Paramètres
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  const currentUser = auth.currentUser;
  const isOwner = baseData?.ownerId === currentUser?.uid;

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'knowledgeBases', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setBaseData({
          name: docSnap.data().name,
          ownerId: docSnap.data().ownerId,
          members: docSnap.data().members || []
        });
      } else {
        // La base n'existe plus ou on n'a plus accès
        setBaseData(null);
      }
    }, (error) => {
      console.error(error);
    });
    return () => unsubscribe();
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !id || !isOwner) return;
    
    try {
      const docRef = doc(db, 'knowledgeBases', id);
      await updateDoc(docRef, {
        members: arrayUnion(inviteEmail.trim().toLowerCase())
      });
      setInviteEmail('');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'invitation.");
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!id || !isOwner) return;
    if (email === currentUser?.email) return; // Ne pas se virer soi-même
    
    try {
      const docRef = doc(db, 'knowledgeBases', id);
      await updateDoc(docRef, {
        members: arrayRemove(email)
      });
    } catch (err) {
      console.error(err);
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
      await updateDoc(doc(db, 'knowledgeBases', id), {
        name: renameInput.trim()
      });
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du renommage.");
    }
  };

  const handleDeleteBase = async () => {
    if (!id || !isOwner) return;
    if (window.confirm("Es-tu sûr de vouloir supprimer définitivement cette base ? Cette action est irréversible.")) {
      try {
        await deleteDoc(doc(db, 'knowledgeBases', id));
        navigate('/');
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleLeaveBase = async () => {
    if (!id || !currentUser?.email) return;
    if (window.confirm("Es-tu sûr de vouloir quitter cette base ? Tu devras être invité à nouveau pour y accéder.")) {
      try {
        await updateDoc(doc(db, 'knowledgeBases', id), {
          members: arrayRemove(currentUser.email)
        });
        navigate('/');
      } catch (err) {
        console.error(err);
        alert("Erreur en quittant la base.");
      }
    }
  };

  const baseName = baseData ? baseData.name : 'Chargement...';

  // Si on a été supprimé de la base ou si elle est supprimée
  if (baseData === null) {
    return (
      <div className="kb-layout" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2>Base introuvable ou accès refusé</h2>
        <button className="btn-cancel" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

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
            <button className="kb-action-btn">
              <Plus size={16} />
              Nouvelle note
            </button>
            <button 
              className="kb-action-btn" 
              title="Vue Graphe"
              onClick={() => setShowGraph(!showGraph)}
              style={{ backgroundColor: showGraph ? 'rgba(255,255,255,0.3)' : '' }}
            >
              <Network size={16} />
              Graphe
            </button>
          </div>
        </div>

        <div className="kb-sidebar-content">
          {/* Dossier 1 */}
          <div className="folder-item" onClick={() => toggleFolder('folder-1')}>
            {expandedFolders['folder-1'] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Folder size={16} fill="rgba(255,255,255,0.2)" />
            <span>Cours Magistraux</span>
          </div>
          {expandedFolders['folder-1'] && (
            <>
              <div 
                className={`note-item ${activeNote === 'note-1' && !showGraph ? 'active' : ''}`}
                onClick={() => { setActiveNote('note-1'); setShowGraph(false); }}
              >
                <FileText size={16} />
                <span>Introduction au réseau</span>
              </div>
              <div 
                className={`note-item ${activeNote === 'note-2' && !showGraph ? 'active' : ''}`}
                onClick={() => { setActiveNote('note-2'); setShowGraph(false); }}
              >
                <FileText size={16} />
                <span>Modèle OSI</span>
              </div>
            </>
          )}

          {/* Dossier 2 */}
          <div className="folder-item" onClick={() => toggleFolder('folder-2')}>
            {expandedFolders['folder-2'] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Folder size={16} fill="rgba(255,255,255,0.2)" />
            <span>Projets Pratiques</span>
          </div>
          {expandedFolders['folder-2'] && (
            <>
              <div 
                className={`note-item ${activeNote === 'note-3' && !showGraph ? 'active' : ''}`}
                onClick={() => { setActiveNote('note-3'); setShowGraph(false); }}
              >
                <FileText size={16} />
                <span>Configuration Switch Cisco</span>
              </div>
            </>
          )}

          {/* Note sans dossier */}
          <div 
            className={`folder-item ${activeNote === 'note-4' && !showGraph ? 'active' : ''}`} 
            style={{ paddingLeft: '1.25rem', backgroundColor: activeNote === 'note-4' && !showGraph ? 'rgba(255,255,255,0.1)' : '' }}
            onClick={() => { setActiveNote('note-4'); setShowGraph(false); }}
          >
            <FileText size={16} />
            <span>Lexique réseau</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="kb-main">
        <header className="kb-main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {showGraph ? (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Vue Graphe (Bêta)</h2>
            ) : activeNote ? (
              <input 
                type="text" 
                value="Titre de la note" 
                readOnly
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white',
                  outline: 'none'
                }} 
              />
            ) : (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>Aucune note sélectionnée</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
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
        
        <div className="kb-main-content" data-color-mode="dark">
          {showGraph ? (
            <div ref={graphContainerRef} style={{ flex: 1, backgroundColor: '#061a1b', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <ForceGraph2D
                width={graphDimensions.width}
                height={graphDimensions.height}
                graphData={mockGraphData}
                nodeLabel="name"
                nodeColor={(node: any) => {
                  if (node.group === 'folder') return '#eab308'; // Jaune pour les dossiers
                  if (node.group === 'tag') return '#3b82f6'; // Bleu pour les tags
                  return '#22c55e'; // Vert pour les notes
                }}
                linkColor={() => 'rgba(255,255,255,0.2)'}
                backgroundColor="#061a1b" // Un peu plus sombre que le fond pour détacher
                onNodeClick={(node: any) => {
                  if (node.group === 'note') {
                    setActiveNote(node.id);
                    setShowGraph(false);
                  }
                }}
              />
            </div>
          ) : activeNote ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <MDEditor
                value={markdownContent}
                onChange={(val) => setMarkdownContent(val || '')}
                height="100%"
                style={{ flex: 1, borderRadius: '0.5rem', overflow: 'hidden' }}
                preview="live"
              />
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
