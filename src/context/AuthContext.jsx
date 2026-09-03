import { createContext, useContext, useState, useCallback } from 'react';
import { useAppData } from './AppContext';
import { isConfigured, fetchUsersFromSheet, updateUserInSheet } from '../services/googleSheets';
import { MASTER_ADMIN } from '../config/masterAdmin';

const AuthContext = createContext(null);

function normalizeSheetUser(u, idx) {
  return {
    id: 'USER-' + (u['No'] ?? idx),
    no: u['No'],
    nama: String(u['Nama'] ?? '').trim(),
    role: String(u['Role'] ?? '').trim(),
    // String(...) sengaja dipakai -- Google Sheets bisa mengembalikan username/password
    // sebagai NUMBER kalau isinya cuma digit (mis. password "123456"), padahal form
    // login selalu mengirim STRING. Tanpa ini, "123456" (teks) !== 123456 (angka) -> gagal login.
    username: String(u['Username'] ?? '').trim(),
    password: String(u['Password'] ?? '').trim(),
    email: String(u['Email'] ?? '').trim(),
  };
}

export function AuthProvider({ children }) {
  const { permissions } = useAppData();
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const login = useCallback(async (username, password) => {
    setLoggingIn(true);
    setLoginError('');

    const uname = String(username).trim();
    const pass = String(password).trim();

    // ---- Akun Admin Induk: SELALU bisa login, tak peduli status Google Sheets ----
    if (uname === MASTER_ADMIN.username && pass === MASTER_ADMIN.password) {
      setLoggingIn(false);
      setCurrentUser({ id: 'MASTER-ADMIN', no: null, isMasterAdmin: true, nama: MASTER_ADMIN.nama, role: MASTER_ADMIN.role, username: MASTER_ADMIN.username, email: MASTER_ADMIN.email, password: MASTER_ADMIN.password });
      return true;
    }

    if (!isConfigured()) {
      setLoggingIn(false);
      setLoginError('Aplikasi belum tersambung ke Google Sheets. Hubungi Admin untuk mengatur koneksi.');
      return false;
    }

    let sheetUsers = [];
    try {
      const rows = await fetchUsersFromSheet();
      sheetUsers = rows.map(normalizeSheetUser);
    } catch (err) {
      setLoggingIn(false);
      setLoginError('Gagal menghubungi Google Sheets: ' + err.message);
      return false;
    }

    const user = sheetUsers.find(u => u.username === uname && u.password === pass);
    setLoggingIn(false);
    if (!user) {
      setLoginError('Username atau password salah. Coba lagi.');
      return false;
    }
    setCurrentUser(user);
    return true;
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  const verifyPassword = useCallback((password) => {
    if (!currentUser) return false;
    return String(password).trim() === String(currentUser.password).trim();
  }, [currentUser]);

  // Ganti password akun sendiri. TIDAK berlaku utk Admin Induk (kredensialnya
  // hardcode di kode sumber, bukan di Sheets -- lihat src/config/masterAdmin.js).
  const changeOwnPassword = useCallback(async (newPassword) => {
    if (!currentUser || currentUser.isMasterAdmin) throw new Error('Akun Admin Induk tidak bisa ganti password lewat sini.');
    await updateUserInSheet({
      No: currentUser.no,
      Nama: currentUser.nama,
      Role: currentUser.role,
      Username: currentUser.username,
      Password: newPassword,
      Email: currentUser.email,
    });
    setCurrentUser(u => ({ ...u, password: newPassword }));
  }, [currentUser]);

  const canAccess = useCallback((pageId) => {
    if (!currentUser) return false;
    const roleperm = permissions[currentUser.role];
    if (!roleperm) return true;
    return roleperm[pageId] !== false;
  }, [currentUser, permissions]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loginError, loggingIn, canAccess, verifyPassword, changeOwnPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
