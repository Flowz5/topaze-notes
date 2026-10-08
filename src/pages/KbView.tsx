import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Home.css'; // On réutilise les styles globaux (boutons, containers)

export default function KbView() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header" style={{ marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')} className="logout-btn">
          <ArrowLeft size={18} />
          Retour au tableau de bord
        </button>
      </header>
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Base de Connaissances</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.25rem' }}>
          ID de la base : {id}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', marginTop: '2rem' }}>
          🚧 Espace en construction... 🚧
        </p>
      </div>
    </div>
  );
}
