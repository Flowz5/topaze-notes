import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h2 className="login-title">
          {isRegistering ? 'CREATE ACCOUNT' : 'USER LOGIN'}
        </h2>
        
        <form onSubmit={handleAuth}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div className="input-group">
            <div className="input-icon-left">
              <User size={20} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="login-input pl"
            />
          </div>

          {/* Password Input */}
          <div className="input-group">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="login-input pr"
            />
            <div className="input-icon-right">
              <Lock size={20} />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn">
            {isRegistering ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="toggle-link-container">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="toggle-link"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
