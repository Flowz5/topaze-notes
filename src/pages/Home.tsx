import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Base de connaissances - Accueil</h1>
      <p className="home-text">
        Page vide pour l'instant. Le contenu collaboratif (Markdown, Graphe, etc.) viendra ici.
      </p>
      
      <button 
        onClick={handleLogout}
        className="logout-btn"
      >
        Déconnexion
      </button>
    </div>
  );
}
