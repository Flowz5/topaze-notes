import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LogOut, Book, Plus, Users, ChevronRight, Database } from 'lucide-react';
import './Home.css';

// Fausses données pour l'interface en attendant Firestore
const mockMyBases = [
  { id: '1', name: 'Dev Web SIO', role: 'Admin' },
  { id: '2', name: 'Projets Persos', role: 'Admin' },
];

const mockInvitedBases = [
  { id: '3', name: 'Réseaux & Sécurité', role: 'Contributeur' },
  { id: '4', name: 'Culture G', role: 'Lecteur' },
];

export default function Home() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBaseName, setNewBaseName] = useState('');

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleCreateBase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaseName.trim()) return;
    
    // TODO: Implémenter l'ajout Firestore
    console.log("Création de la base:", newBaseName);
    
    setIsModalOpen(false);
    setNewBaseName('');
  };

  const openBase = (id: string) => {
    console.log("Ouvrir la base", id);
    // TODO: Naviguer vers la base de connaissances
    // navigate(`/kb/${id}`);
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
      <div className="dashboard-grid">
        
        {/* COLONNE GAUCHE : Mes Bases */}
        <div>
          <h2 className="section-title">Mes Bases de Connaissances</h2>
          <div className="kb-list">
            
            {mockMyBases.map((kb) => (
              <div key={kb.id} className="kb-card" onClick={() => openBase(kb.id)}>
                <div className="kb-info">
                  <div className="kb-icon-wrapper">
                    <Database size={20} />
                  </div>
                  <div>
                    <div className="kb-name">{kb.name}</div>
                    <div className="kb-role">{kb.role}</div>
                  </div>
                </div>
                <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
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
            {mockInvitedBases.length > 0 ? (
              mockInvitedBases.map((kb) => (
                <div key={kb.id} className="kb-card" onClick={() => openBase(kb.id)}>
                  <div className="kb-info">
                    <div className="kb-icon-wrapper">
                      <Users size={20} />
                    </div>
                    <div>
                      <div className="kb-name">{kb.name}</div>
                      <div className="kb-role">{kb.role}</div>
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
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-confirm">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
