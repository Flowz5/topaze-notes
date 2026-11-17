import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Home from './pages/Home';
import KbView from './pages/KbView';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './theme/ThemeContext';
import Brand from './components/Brand';
import './index.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider>
        <div className="app-loading">
          <Brand size="lg" />
          <Loader2 className="animate-spin" size={22} />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/" 
          element={user ? <Home /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/kb/:id" 
          element={user ? <KbView /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
