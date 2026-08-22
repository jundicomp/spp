import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function submit(e) {
    e.preventDefault();
    login(username, password);
  }
  function fillDemo(u, p) {
    setUsername(u);
    setPassword(p);
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <svg width="64" height="64" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="21" fill="#1C7A3C" />
          <text x="24" y="25" textAnchor="middle" dominantBaseline="central" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="800" fill="#F0B429">MI</text>
        </svg>
        <h2>MI Ikhlasiyah</h2>
        <p className="login-sub">SPP dan Sarpras</p>
        <form onSubmit={submit}>
          <div className="field" style={{ marginBottom: 14, textAlign: 'left' }}>
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="mis. bendahara" />
          </div>
          <div className="field" style={{ marginBottom: 14, textAlign: 'left' }}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Masuk</button>
        </form>
        {loginError && <p className="login-error">{loginError}</p>}
        <div className="login-demo-hint">
          <p>Akun Demo (klik untuk isi otomatis)</p>
          <div className="login-demo-item" onClick={() => fillDemo('kepsek', 'kepsek123')}><span>Kepala Sekolah</span><code>kepsek</code></div>
          <div className="login-demo-item" onClick={() => fillDemo('bendahara', 'bendahara123')}><span>Bendahara / TU</span><code>bendahara</code></div>
          <div className="login-demo-item" onClick={() => fillDemo('staftu', 'staftu123')}><span>Staf TU</span><code>staftu</code></div>
        </div>
      </div>
    </div>
  );
}
