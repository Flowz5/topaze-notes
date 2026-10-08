import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implémenter la logique Firebase Auth
    // auth.signInWithEmailAndPassword(...)
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b2d30]">
      <div className="w-full max-w-sm p-8">
        <h2 className="text-center text-3xl font-extrabold text-white mb-10 tracking-widest">
          USER LOGIN
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Input */}
          <div className="relative flex items-center">
            <div className="absolute left-1 w-10 h-10 flex items-center justify-center bg-white rounded-full">
              <User className="text-[#0b2d30]" size={20} />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
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
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
