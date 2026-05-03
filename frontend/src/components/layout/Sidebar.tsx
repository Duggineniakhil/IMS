import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/incidents', icon: '🔥', label: 'Incidents' },
  { path: '/simulate', icon: '⚡', label: 'Simulate' },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <>
      <aside
        className={`sidebar ${expanded ? 'expanded' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="sidebar-logo" onClick={() => setExpanded(!expanded)}>
          <div className="logo-icon">IM</div>
          <span className="logo-text">IMS</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <span className="item-icon">{item.icon}</span>
                <span className="item-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--sidebar-border)' }}>
          <div className="sidebar-item" style={{ cursor: 'default' }}>
            <span className="item-icon">🟢</span>
            <span className="item-label" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              System Healthy
            </span>
          </div>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div
        style={{
          width: expanded ? 'var(--sidebar-expanded)' : 'var(--sidebar-collapsed)',
          flexShrink: 0,
          transition: 'width var(--transition-base)',
        }}
      />
    </>
  );
}
