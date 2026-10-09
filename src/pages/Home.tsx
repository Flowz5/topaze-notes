import { structureBtsSio } from "../dataBtsSio";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, writeBatch, deleteDoc, doc } from 'firebase/firestore';
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

  // Je récupère l'utilisateur connecté, indispensable pour savoir qui est qui !
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    // Je lance une écoute en temps réel sur Firebase (Firestore) pour récupérer 
    // toutes les bases où mon adresse email fait partie du tableau "members".
    const q = query(
      collection(db, 'knowledgeBases'),
      where('members', 'array-contains', user.email)
    );

    // Snapshot ! À chaque fois qu'une base est ajoutée, modifiée ou supprimée, 
    // cette fonction se relance automatiquement et met l'interface à jour !
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allBases: KnowledgeBase[] = [];
      snapshot.forEach((docSnap) => {
        allBases.push({ id: docSnap.id, ...docSnap.data() } as KnowledgeBase);
      });
      
      // Ici je sépare intelligemment ce qui m'appartient (ownerId == moi) 
      // et ce que mes potes/collègues ont partagé avec moi (ownerId != moi)
      setMyBases(allBases.filter(b => b.ownerId === user.uid));
      setSharedBases(allBases.filter(b => b.ownerId !== user.uid));
      setLoading(false);
    }, (error) => {
      console.error("Erreur Firestore (Permissions ?) :", error);
      alert("Impossible de lire les bases. Vérifie les règles Firestore.");
      setLoading(false);
    });

    // Pas de fuite de mémoire : on arrête d'écouter si on change de page
    return () => unsubscribe();
  }, []);

  
  const handleSetupBTS = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (!window.confirm("Créer la base BTS SIO avec tous les dossiers et notes ?")) return;

    try {
      setLoading(true);
      
      // 1. Create Base
      const kbRef = await addDoc(collection(db, 'knowledgeBases'), {
        name: 'BTS SIO',
        ownerId: user.uid,
        members: [user.email],
        createdAt: serverTimestamp()
      });
      const kbId = kbRef.id;

      // 2. Prepare structure
      const structure = structureBtsSio;

      // 3. Batch insert (Firestore limits to 500 writes per batch, we are far below)
      const batch = writeBatch(db);

      for (const cat of structure) {
        // Main folder
        const catRef = doc(collection(db, 'knowledgeBases', kbId, 'folders'));
        batch.set(catRef, {
          name: cat.folder,
          parentId: null,
          authorEmail: user.email,
          createdAt: serverTimestamp()
        });

        // Subfolders and notes
        for (const sub of cat.subfolders) {
          const subRef = doc(collection(db, 'knowledgeBases', kbId, 'folders'));
          batch.set(subRef, {
            name: sub.name,
            parentId: catRef.id,
            authorEmail: user.email,
            createdAt: serverTimestamp()
          });

          const noteRef = doc(collection(db, 'knowledgeBases', kbId, 'notes'));
          batch.set(noteRef, {
            title: `Syntaxe et bases : ${sub.name}`,
            content: `${sub.note}<p><em>Ajoutez vos notes ici...</em></p>`,
            folderId: subRef.id,
            authorEmail: user.email,
            createdAt: serverTimestamp(),
            tags: sub.name.toLowerCase()
          });
        }
      }

      await batch.commit();
      alert("Base BTS SIO créée avec succès !");
      setLoading(false);
      
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de la base BTS SIO.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // La fonction pour créer une toute nouvelle base de connaissances
  const handleCreateBase = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!newBaseName.trim() || !user?.email) return;
    
    setIsCreating(true);
    try {
      // J'enregistre le nom, le propriétaire et je m'ajoute automatiquement 
      // dans la liste des membres autorisés.
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

  // Et voilà le fameux bouton pour supprimer définitivement une base !
  // (Faut faire gaffe car ça supprime juste la base, il faudra faire une fonction 
  // en backend (Cloud Functions) ou côté client pour supprimer toutes les notes 
  // à l'intérieur pour pas laisser de déchets dans Firebase).
  const handleDeleteBase = async (e: React.MouseEvent, kbId: string) => {
    e.stopPropagation(); // Pour éviter de déclencher l'ouverture de la base en même temps !
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
              
              {/* BOUTON SETUP BTS SIO */}
              <button className="create-card" onClick={handleSetupBTS} style={{ background: 'rgba(255, 255, 255, 0.05)', borderStyle: 'dashed' }}>
                <span style={{ fontWeight: 600 }}>🎓 Générer la base BTS SIO</span>
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
