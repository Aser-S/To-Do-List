import { useState } from 'react';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'admin'

  const handleAdminAccess = (password) => {
    // Simple admin password check
    if (password === 'admin123') {
      setCurrentView('admin');
      return true;
    }
    return false;
  };

  return (
    <div className="app-container">
      {currentView === 'admin' ? (
        <>
          <div className="view-toggle">
            <button className="toggle-btn" onClick={() => setCurrentView('dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
          <AdminPanel />
        </>
      ) : (
        <Dashboard onAdminAccess={handleAdminAccess} />
      )}
    </div>
  );
}

export default App;
