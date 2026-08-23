import { createContext, useContext, useState, useCallback } from 'react';
import { useAppData } from './AppContext';
import { isConfigured, fetchUsersFromSheet } from '../services/googleSheets';

const AuthContext = createContext(null);

function normalizeSheetUser(u, idx) {
  return {
    id: 'SHEET-' + (u['No'] ?? idx),
    nama: u['Nama'],
    role: u['Role'],
    username: u['Username'],
    password: u['Password'],
    email: u['Email'],
  };
}

export function AuthProvider({ children }) {
  const { users, permissions } = useAppData();
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const login = useCallback(async (username, password) => {
    setLoggingIn(true);
    setLoginError('');
    let allUsers = users; // akun demo lokal -- selalu tersedia sbg cadangan
    if (isConfigured()) {
      try {
        const sheetUsers = await fetchUsersFromSheet();
        allUsers = [...users, ...sheetUsers.map(normalizeSheetUser)];
      } catch (err) {
        // Sheets gagal dihubungi -> tetap coba login pakai akun demo lokal saja, jangan blokir user
        console.warn('Gagal mengambil daftar user dari Google Sheets:', err.message);
      }
    }
    const user = allUsers.find(u => u.username === username && u.password === password);
    setLoggingIn(false);
    if (!user) {
      setLoginError('Username atau password salah. Coba lagi.');
      return false;
    }
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
    <AuthContext.Provider value={{ currentUser, login, logout, loginError, loggingIn, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
