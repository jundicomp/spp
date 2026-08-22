import { createContext, useContext, useState, useCallback } from 'react';
import { useAppData } from './AppContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { users, permissions } = useAppData();
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');

  const login = useCallback((username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      setLoginError('Username atau password salah. Coba lagi.');
      return false;
    }
    setLoginError('');
    setCurrentUser(user);
    return true;
  }, [users]);

  const logout = useCallback(() => setCurrentUser(null), []);

  const canAccess = useCallback((pageId) => {
    if (!currentUser) return false;
    const roleperm = permissions[currentUser.role];
    if (!roleperm) return true;
    return roleperm[pageId] !== false;
  }, [currentUser, permissions]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loginError, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
