import { useEffect, useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('ims-theme');
    return (stored as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ims-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="header-bar" style={{ background: 'transparent', borderBottom: 'none' }}>
      <div className="header-left">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="header-title">{title}</h1>
            <div className="badge badge-resolved" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', padding: '2px 8px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot active pulse-dot-resolved" style={{ width: '6px', height: '6px' }}></span>
              LIVE
            </div>
          </div>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="header-right">
        <button
          className="header-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="header-btn" title="Notifications">
          🔔
        </button>
      </div>
    </header>
  );
}
