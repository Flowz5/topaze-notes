import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { LogOut, Book, Plus, Users, ChevronRight, Database, Loader2, Trash2, Share2 } from 'lucide-react';
import Brand from '../components/Brand';
import ThemeToggle from '../components/ThemeToggle';
import { deleteKnowledgeBase } from '../lib/deleteKnowledgeBase';
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

  // Suppression définitive d'une base, avec toutes ses notes et dossiers
  // (voir lib/deleteKnowledgeBase.ts).
  const handleDeleteBase = async (e: React.MouseEvent, kbId: string) => {
    e.stopPropagation(); // Pour éviter de déclencher l'ouverture de la base en même temps !
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette base de connaissances ? Toutes les notes et les dossiers à l'intérieur seront perdus.")) {
      try {
        await deleteKnowledgeBase(db, kbId, auth.currentUser!.uid);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Impossible de supprimer la base.");
      }
    }
  };

  const openBase = (id: string) => {
    navigate(`/kb/${id}`);
  };

  const userEmail = auth.currentUser?.email || '';
  const initial = userEmail.charAt(0).toUpperCase() || '?';

  return (
    <div className="home-container">
      <div className="home-glow" aria-hidden="true" />

      {/* HEADER */}
      <header className="home-header">
        <Brand />
        <div className="home-header-actions">
          <div className="home-user" title={userEmail}>
            <span className="home-avatar">{initial}</span>
            <span className="home-user-email">{userEmail}</span>
          </div>
          <ThemeToggle />
          <button onClick={handleLogout} className="logout-btn" title="Déconnexion">
            <LogOut size={16} />
            <span className="btn-text">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="home-main">
        <div className="home-hero">
          <div>
            <h1 className="home-title">Mes espaces</h1>
            <p className="home-subtitle">Retrouve tes bases de connaissances et celles partagées avec toi.</p>
          </div>
          <button className="btn btn-primary home-create-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Nouvelle base
          </button>
        </div>

        {/* MAIN DASHBOARD */}
        {loading ? (
          <div className="home-loading">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <div className="dashboard-sections">

            {/* Mes Bases */}
            <section>
              <h2 className="section-title">
                Mes bases <span className="section-count">{myBases.length}</span>
              </h2>
              <div className="kb-grid">
                {myBases.map((kb) => (
                  <div key={kb.id} className="kb-card" onClick={() => openBase(kb.id)}>
                    <div className="kb-card-top">
                      <div className="kb-icon-wrapper">
                        <Database size={20} />
                      </div>
                      <button className="delete-base-btn" onClick={(e) => handleDeleteBase(e, kb.id)} title="Supprimer la base">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="kb-name">{kb.name}</div>
                    <div className="kb-card-footer">
                      <span className="kb-role">Propriétaire</span>
                      <span className="kb-members"><Users size={14} /> {kb.members?.length ?? 1}</span>
                      <ChevronRight size={18} className="kb-chevron" />
                    </div>
                  </div>
                ))}

                {/* Bouton Créer */}
                <button className="create-card" onClick={() => setIsModalOpen(true)}>
                  <div className="create-icon-wrapper">
                    <Plus size={22} />
                  </div>
                  <span>Créer une nouvelle base</span>
                </button>
              </div>
            </section>

            {/* Bases partagées avec moi */}
            <section>
              <h2 className="section-title">
                Partagées avec moi <span className="section-count">{sharedBases.length}</span>
              </h2>
              {sharedBases.length > 0 ? (
                <div className="kb-grid">
                  {sharedBases.map((kb) => (
                    <div key={kb.id} className="kb-card" onClick={() => openBase(kb.id)}>
                      <div className="kb-card-top">
                        <div className="kb-icon-wrapper is-shared">
                          <Users size={20} />
                        </div>
                      </div>
                      <div className="kb-name">{kb.name}</div>
                      <div className="kb-card-footer">
                        <span className="kb-role is-guest">Invité</span>
                        <span className="kb-members"><Users size={14} /> {kb.members?.length ?? 1}</span>
                        <ChevronRight size={18} className="kb-chevron" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Share2 size={22} />
                  <span>Aucune base partagée pour le moment.</span>
                </div>
              )}
            </section>

          </div>
        )}
      </main>

      {/* MODAL CRÉATION */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isCreating && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Nouvelle base</h3>
            <form onSubmit={handleCreateBase}>
              <label className="field-label" htmlFor="new-base-name">Nom de la base</label>
              <div className="field">
                <span className="field-icon"><Book size={18} /></span>
                <input
                  id="new-base-name"
                  type="text"
                  required
                  value={newBaseName}
                  onChange={(e) => setNewBaseName(e.target.value)}
                  placeholder="Ex : Cours BTS SIO"
                  className="input"
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
