import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Brand from '../components/Brand';
import ThemeToggle from '../components/ThemeToggle';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glow" aria-hidden="true" />

      <div className="login-topbar">
        <Brand />
        <ThemeToggle />
      </div>

      <div className="login-card">
        <div className="login-heading">
          <h1 className="login-title">
            {isRegistering ? 'Créer un compte' : 'Bon retour 👋'}
          </h1>
          <p className="login-subtitle">
            {isRegistering
              ? 'Commence à construire ta base de connaissances.'
              : 'Connecte-toi pour retrouver tes espaces.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div>
            <label className="field-label" htmlFor="login-email">Email</label>
            <div className="field">
              <span className="field-icon"><Mail size={18} /></span>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="login-password">Mot de passe</label>
            <div className="field">
              <span className="field-icon"><Lock size={18} /></span>
              <input
                id="login-password"
                type="password"
                required
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {isRegistering ? "S'inscrire" : 'Se connecter'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="toggle-link-container">
          {isRegistering ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="toggle-link"
          >
            {isRegistering ? 'Se connecter' : "S'inscrire"}
          </button>
        </div>
      </div>

      <p className="login-footer">Ta base de connaissances, connectée et collaborative.</p>
    </div>
  );
}
