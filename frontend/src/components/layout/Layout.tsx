import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="app-layout" style={{ 
      background: 'var(--bg-hero-gradient)', 
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      <Sidebar />
      <div className="main-content" style={{ zIndex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}
