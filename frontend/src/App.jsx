import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DemoClient from './pages/DemoClient';
import AdminDashboard from './pages/AdminDashboard';
import { Map, LayoutDashboard } from 'lucide-react';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="nav-bar glass-panel" style={{ margin: '1rem 2rem', borderRadius: '1rem' }}>
      <div className="nav-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Map size={28} color="#3b82f6" />
        LocData API
      </div>
      <div className="nav-links">
        <button 
          className={location.pathname === '/' ? 'active' : ''} 
          onClick={() => navigate('/')}
        >
          <Map size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/>
          Demo Client
        </button>
        <button 
          className={location.pathname === '/admin' ? 'active' : ''} 
          onClick={() => navigate('/admin')}
        >
          <LayoutDashboard size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/>
          Admin Dashboard
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<DemoClient />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
