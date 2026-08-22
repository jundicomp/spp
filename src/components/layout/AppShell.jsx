import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ToastContainer from '../common/ToastContainer';

export default function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
      <ToastContainer />
    </div>
  );
}
