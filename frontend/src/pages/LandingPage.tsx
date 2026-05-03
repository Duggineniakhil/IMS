import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      background: 'var(--bg-hero-gradient)', 
      minHeight: '100vh', 
      color: 'var(--text-primary)',
      overflowX: 'hidden'
    }}>
      {/* Navbar */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px 48px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '28px', height: '28px', 
            background: 'linear-gradient(135deg, var(--brand), var(--brand-light))', 
            borderRadius: '8px', 
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' 
          }}>⚡</div>
          IMS
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          <span style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Home</span>
          <span style={{ cursor: 'pointer' }}>Products</span>
          <span style={{ cursor: 'pointer' }}>Resources</span>
          <span style={{ cursor: 'pointer' }}>Pricing</span>
        </div>
        <button className="btn" style={{ background: '#111', color: 'white', borderRadius: '99px', padding: '8px 24px' }}>
          Sign In
        </button>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginTop: '80px', marginBottom: '80px' }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
            fontSize: 'clamp(48px, 6vw, 72px)', 
            fontWeight: 800, 
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '32px',
            color: 'var(--text-primary)'
          }}>
            Real-Time Distributed <br/> Incident Management
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn" style={{ 
              background: 'white', 
              color: 'var(--brand)', 
              boxShadow: '0 8px 20px rgba(110,86,207,0.12)',
              padding: '14px 32px',
              fontWeight: 600
            }} onClick={() => navigate('/simulate')}>
              ▶ Watch Video
            </button>
            <button className="btn btn-primary" style={{ padding: '14px 32px' }} onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </motion.div>
        </div>

        {/* Backed by the best */}
        <div style={{ textAlign: 'center', marginBottom: '100px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '24px' }}>Backed by the best engineers</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', opacity: 0.6, filter: 'grayscale(100%)' }}>
            {['Meta', 'Square', 'Robinhood', 'Stripe', 'Okta', 'Vercel'].map(company => (
              <span key={company} style={{ fontWeight: 700, fontSize: '18px' }}>{company}</span>
            ))}
          </div>
        </div>

        {/* Common Challenges */}
        <div style={{ textAlign: 'center', marginBottom: '120px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Common Challenges In Incident Handling</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px', fontSize: '15px' }}>
            Handling incidents across distributed systems leads to alert fatigue and frustrated users. A smarter approach drives faster recovery.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
            {['How to detect issues early?', 'Alert fatigue reduction', 'Which tool improves on-call management?', 'How do I reduce downtime?', 'Who should streamline resolutions?'].map((tag, i) => (
              <span key={i} style={{ 
                background: 'white', 
                padding: '10px 20px', 
                borderRadius: '99px', 
                fontSize: '13px', 
                fontWeight: 500,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                border: '1px solid rgba(110, 86, 207, 0.1)'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Designed For Simplicity */}
        <div style={{ display: 'flex', gap: '64px', alignItems: 'center', marginBottom: '140px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>Designed For<br/>Simplicity First</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
              Simple, modern, and so easy new engineers can use it. You are never left wondering what to do next.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--brand)', boxShadow: '0 4px 20px rgba(110,86,207,0.1)' }}>
                <h4 style={{ fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span>⚡</span> Rapid On-boarding
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Simple, modern, and so easy new engineers can use it.</p>
              </div>
              <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.4)' }}>
                <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span>⚙️</span> Smart Defaults
                </h4>
              </div>
              <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.4)' }}>
                <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span>📚</span> Built-In Tutorials
                </h4>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', padding: '40px', borderRadius: '32px', border: '1px solid rgba(110,86,207,0.1)' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>Top Incident causes in January 2024</h3>
              <div style={{ height: '120px', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '16px' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '12px' }}>
                  <span>Check log analysis</span> <span style={{ color: 'var(--brand)', fontWeight: 600 }}>+ Add</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '12px' }}>
                  <span>Check for recent updates</span> <span style={{ color: 'var(--brand)', fontWeight: 600 }}>+ Add</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Who We Work With */}
        <div style={{ textAlign: 'center', marginBottom: '140px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Who We Work With</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 48px', fontSize: '15px' }}>
            We grow with you at every stage—whether you're just starting out, scaling rapidly, or an enterprise.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ background: 'white', padding: '40px 32px', borderRadius: '24px', textAlign: 'left', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Startup</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '40px' }}>Set out your incident management effortlessly. Designed for teams setting up their first on-call schedule.</p>
              <div style={{ display: 'flex', gap: '16px', opacity: 0.6, fontWeight: 700 }}><span>Vercel</span><span>Loom</span></div>
            </div>
            <div style={{ background: '#FFFBF5', padding: '40px 32px', borderRadius: '24px', textAlign: 'left', border: '1px solid rgba(249,115,22,0.1)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Scaling Teams</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '40px' }}>Optimize and streamline your incident response. Bring predictability and efficiency to your growing operations.</p>
              <div style={{ display: 'flex', gap: '16px', opacity: 0.6, fontWeight: 700 }}><span>Stripe</span><span>Rippling</span></div>
            </div>
            <div style={{ background: 'linear-gradient(180deg, #1A1140 0%, #302170 100%)', color: 'white', padding: '40px 32px', borderRadius: '24px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Enterprise</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '40px' }}>Enterprise-grade security and customizability at robust scale. A solid solution built for large scale.</p>
              <div style={{ display: 'flex', gap: '16px', opacity: 0.6, fontWeight: 700 }}><span>Cloudflare</span><span>IBM</span></div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ 
          background: 'var(--bg-footer-gradient)', 
          borderRadius: '40px', 
          padding: '80px 40px', 
          textAlign: 'center',
          color: 'white',
          marginBottom: '60px'
        }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>Ready to Get Started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '40px' }}>Book a personalized 1:1 demo with our technical team for a free 14-day trial.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn" style={{ background: 'white', color: 'black', padding: '12px 32px', fontWeight: 600 }}>Start Trial</button>
            <button className="btn" style={{ background: 'var(--brand)', color: 'white', padding: '12px 32px', fontWeight: 600 }}>Book A Demo</button>
          </div>
        </div>

        {/* Real Footer */}
        <footer style={{ display: 'flex', justifyContent: 'space-between', padding: '40px 0', borderTop: '1px solid var(--border-primary)', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          <div style={{ display: 'flex', gap: '48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>PRODUCT</strong>
              <span>On-Call</span>
              <span>Response</span>
              <span>Learning</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>SOLUTIONS</strong>
              <span>Startups</span>
              <span>Enterprise</span>
              <span>Security Centers</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span>⚡</span> IMS
          </div>
        </footer>
      </div>
    </div>
  );
}
