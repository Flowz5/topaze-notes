import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { LogOut, Book, Plus, Users, ChevronRight, Database, Loader2, Trash2 } from 'lucide-react';
import './Home.css';

type KnowledgeBase = {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
};

export default function Home() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBaseName, setNewBaseName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [myBases, setMyBases] = useState<KnowledgeBase[]>([]);
  const [sharedBases, setSharedBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    // Écouter toutes les bases où l'utilisateur (via son email) est membre
    const q = query(
      collection(db, 'knowledgeBases'),
      where('members', 'array-contains', user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allBases: KnowledgeBase[] = [];
      snapshot.forEach((docSnap) => {
        allBases.push({ id: docSnap.id, ...docSnap.data() } as KnowledgeBase);
      });
      
      // Séparer les bases possédées vs partagées
      setMyBases(allBases.filter(b => b.ownerId === user.uid));
      setSharedBases(allBases.filter(b => b.ownerId !== user.uid));
      setLoading(false);
    }, (error) => {
      console.error("Erreur Firestore (Permissions ?) :", error);
      alert("Impossible de lire les bases. Vérifie les règles Firestore.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleCreateBase = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!newBaseName.trim() || !user?.email) return;
    
    setIsCreating(true);
    try {
      await addDoc(collection(db, 'knowledgeBases'), {
        name: newBaseName.trim(),
        ownerId: user.uid,
        members: [user.email],
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewBaseName('');
    } catch (error) {
      console.error("Erreur lors de la création de la base:", error);
      alert("Une erreur est survenue lors de la création.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBase = async (e: React.MouseEvent, kbId: string) => {
    e.stopPropagation();
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette base de connaissances ? Toutes les notes et les dossiers à l'intérieur seront perdus.")) {
      try {
        await deleteDoc(doc(db, 'knowledgeBases', kbId));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Impossible de supprimer la base.");
      }
    }
  };

  const openBase = (id: string) => {
    navigate(`/kb/${id}`);
  };

  return (
    <div className="home-container">
      {/* HEADER */}
      <header className="home-header">
        <h1 className="home-title">Mes Espaces</h1>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          Déconnexion
        </button>
      </header>

      {/* MAIN DASHBOARD */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem', color: 'rgba(255,255,255,0.5)' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="dashboard-grid">
          
          {/* COLONNE GAUCHE : Mes Bases */}
          <div>
            <h2 className="section-title">Mes Bases de Connaissances</h2>
            <div className="kb-list">
              
              {myBases.map((kb) => (
                <div key={kb.id} className="kb-card" onClick={() => openBase(kb.id)}>
                  <div className="kb-info">
                    <div className="kb-icon-wrapper">
                      <Database size={20} />
                    </div>
                    <div>
                      <div className="kb-name">{kb.name}</div>
                      <div className="kb-role">Propriétaire</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="delete-base-btn" onClick={(e) => handleDeleteBase(e, kb.id)} title="Supprimer la base">
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                  </div>
                </div>
              ))}

              {/* Bouton Créer */}
              <button className="create-card" onClick={() => setIsModalOpen(true)}>
                <div className="create-icon-wrapper">
                  <Plus size={24} />
                </div>
                <span style={{ fontWeight: 600 }}>Créer une nouvelle base</span>
              </button>

            </div>
          </div>

          {/* COLONNE DROITE : Bases partagées avec moi */}
          <div>
            <h2 className="section-title">Partagées avec moi</h2>
            <div className="kb-list">
              {sharedBases.length > 0 ? (
                sharedBases.map((kb) => (
                  <div key={kb.id} className="kb-card" onClick={() => openBase(kb.id)}>
                    <div className="kb-info">
                      <div className="kb-icon-wrapper">
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="kb-name">{kb.name}</div>
                        <div className="kb-role">Invité</div>
                      </div>
                    </div>
                    <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                  </div>
                ))
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>
                  Aucune base partagée pour le moment.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* MODAL CRÉATION */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Nouvelle Base</h3>
            <form onSubmit={handleCreateBase}>
              <div className="input-group">
                <div className="input-icon-left">
                  <Book size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={newBaseName}
                  onChange={(e) => setNewBaseName(e.target.value)}
                  placeholder="Nom de la base..."
                  className="home-input"
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-confirm"
                  disabled={isCreating}
                >
                  {isCreating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
