import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { authErrorMessage } from '../lib/authErrors';
import Brand from '../components/Brand';
import ThemeToggle from '../components/ThemeToggle';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Indique ton email ci-dessus, puis clique à nouveau sur « Mot de passe oublié ? ».');
      return;
    }
    setIsSubmitting(true);
    try {
      auth.languageCode = 'fr'; // email de réinitialisation en français
      await sendPasswordResetEmail(auth, email.trim());
      // Message volontairement neutre : on ne révèle pas si un compte existe pour cet email
      setInfo(`Si un compte existe pour ${email.trim()}, un email de réinitialisation vient d'être envoyé.`);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        setInfo(`Si un compte existe pour ${email.trim()}, un email de réinitialisation vient d'être envoyé.`);
      } else {
        setError(authErrorMessage(err));
      }
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
          {error && <div className="error-message" role="alert">{error}</div>}
          {info && <div className="info-message" role="status">{info}</div>}

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
            <div className="field-label-row">
              <label className="field-label" htmlFor="login-password">Mot de passe</label>
              {!isRegistering && (
                <button type="button" className="forgot-link" onClick={handleResetPassword} disabled={isSubmitting}>
                  Mot de passe oublié ?
                </button>
              )}
            </div>
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
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setInfo(''); }}
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
