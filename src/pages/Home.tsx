import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b2d30] text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Base de connaissances - Accueil</h1>
      <p className="mb-8 text-gray-300">
        Page vide pour l'instant. Le contenu collaboratif (Markdown, Graphe, etc.) viendra ici.
      </p>
      
      <button 
        onClick={() => navigate('/login')}
        className="px-6 py-2 bg-white text-[#0b2d30] font-semibold rounded-full hover:bg-gray-200 transition-colors"
      >
        Déconnexion (retour au login)
      </button>
    </div>
  );
}
