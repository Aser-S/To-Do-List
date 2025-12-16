import { useState } from 'react';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import AggregationsPage from './components/Aggregation';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'admin', or 'aggregation'
  const [loggedInAgent, setLoggedInAgent] = useState(null);
  const [spaces, setSpaces] = useState([]);

  const handleAdminAccess = (password) => {
    // Simple admin password check
    if (password === 'admin123') {
      setCurrentView('admin');
      return true;
    }
    return false;
  };

  const handleAggregationAccess = (agent, spacesData) => {
    setLoggedInAgent(agent);
    setSpaces(spacesData);
    setCurrentView('aggregation');
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
      ) : currentView === 'aggregation' ? (
        <>
          <div className="view-toggle">
            <button className="toggle-btn" onClick={() => setCurrentView('dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
          <AggregationsPage loggedInAgent={loggedInAgent} spaces={spaces} />
        </>
      ) : (
        <Dashboard 
          onAdminAccess={handleAdminAccess} 
          onAggregationAccess={handleAggregationAccess}
        />
      )}
    </div>
  );
}

export default App;
