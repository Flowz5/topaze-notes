import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b2d30]">
      <div className="w-full max-w-sm p-8">
        <h2 className="text-center text-3xl font-extrabold text-white mb-10 tracking-widest">
          {isRegistering ? 'CREATE ACCOUNT' : 'USER LOGIN'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div className="relative flex items-center">
            <div className="absolute left-1 w-10 h-10 flex items-center justify-center bg-white rounded-full">
              <User className="text-[#0b2d30]" size={20} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-12 pl-14 pr-4 rounded-full bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          {/* Password Input */}
          <div className="relative flex items-center">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-12 pl-6 pr-14 rounded-full bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <div className="absolute right-1 w-10 h-10 flex items-center justify-center bg-white rounded-full">
              <Lock className="text-[#0b2d30]" size={20} />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-12 mt-8 bg-white text-[#0b2d30] font-bold rounded-full hover:bg-gray-100 transition-colors uppercase tracking-wide"
          >
            {isRegistering ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-gray-300 hover:text-white text-sm underline"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
