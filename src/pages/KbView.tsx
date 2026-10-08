import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  ArrowLeft, Plus, Share2, Network, 
  Folder, FileText, ChevronDown, ChevronRight, Settings 
} from 'lucide-react';
import './KbView.css';

export default function KbView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [baseName, setBaseName] = useState<string>('Chargement...');
  
  // Mock d'une arborescence pour la démo
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'folder-1': true,
  });
  const [activeNote, setActiveNote] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchBaseInfo = async () => {
      try {
        const docRef = doc(db, 'knowledgeBases', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBaseName(docSnap.data().name);
        } else {
          setBaseName('Base introuvable');
        }
      } catch (err) {
        console.error(err);
        setBaseName('Erreur');
      }
    };
    fetchBaseInfo();
  }, [id]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

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
            <button className="kb-action-btn" title="Vue Graphe">
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
                className={`note-item ${activeNote === 'note-1' ? 'active' : ''}`}
                onClick={() => setActiveNote('note-1')}
              >
                <FileText size={16} />
                <span>Introduction au réseau</span>
              </div>
              <div 
                className={`note-item ${activeNote === 'note-2' ? 'active' : ''}`}
                onClick={() => setActiveNote('note-2')}
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
                className={`note-item ${activeNote === 'note-3' ? 'active' : ''}`}
                onClick={() => setActiveNote('note-3')}
              >
                <FileText size={16} />
                <span>Configuration Switch Cisco</span>
              </div>
            </>
          )}

          {/* Note sans dossier */}
          <div 
            className="folder-item" 
            style={{ paddingLeft: '1.25rem' }}
            onClick={() => setActiveNote('note-4')}
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
            {activeNote ? (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Titre de la note</h2>
            ) : (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>Aucune note sélectionnée</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="logout-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              <Share2 size={16} />
              Partager
            </button>
            <button className="logout-btn" style={{ padding: '0.5rem', borderRadius: '50%' }}>
              <Settings size={18} />
            </button>
          </div>
        </header>
        
        <div className="kb-main-content">
          {activeNote ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>L'éditeur Markdown arrivera ici !</h1>
              <p>Tu pourras écrire tes notes, ajouter des tags, etc.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <Network size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.25rem' }}>Sélectionne une note ou ouvre la vue Graphe</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
