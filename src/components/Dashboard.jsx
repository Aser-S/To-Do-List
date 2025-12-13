import { useState, useEffect } from 'react';
import SpaceBox from './SpaceBox';
import AddSpaceModal from './AddSpaceModal';
import StatsDashboard from './StatsDashboard';

const API_BASE = 'http://localhost:5000/api';

function Dashboard({ onAdminAccess }) {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agentName, setAgentName] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [loggedInAgent, setLoggedInAgent] = useState(null);
  const [showAddSpaceModal, setShowAddSpaceModal] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const fetchSpaces = async (agentNameParam = null) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/spaces`;
      if (agentNameParam) {
        url = `${API_BASE}/spaces/agent/name/${encodeURIComponent(agentNameParam)}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setSpaces(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch spaces');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch(`${API_BASE}/agents/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      
      if (result.success) {
        // Ensure the agent data has _id field
        const agentData = {
          ...result.data,
          _id: result.data.id || result.data._id
        };
        setLoggedInAgent(agentData);
        setShowLogin(false);
        fetchSpaces(agentData.name);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setLoggedInAgent(null);
    setShowLogin(true);
    setSpaces([]);
    setAgentName('');
  };

  const handleLoadByAgent = () => {
    if (agentName.trim()) {
      fetchSpaces(agentName.trim());
    }
  };

  const handleSpaceAdded = (newSpace) => {
    setSpaces([...spaces, newSpace]);
    setShowAddSpaceModal(false);
  };

  const handleSpaceDeleted = (spaceId) => {
    setSpaces(spaces.filter(s => s._id !== spaceId));
  };

  const handleAdminClick = () => {
    setShowAdminPrompt(true);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    const isCorrect = adminPassword === 'admin123';
    if (isCorrect) {
      // Call parent's admin access handler
      if (onAdminAccess) {
        const success = onAdminAccess(adminPassword);
        if (success) {
          setAdminPassword('');
          setShowAdminPrompt(false);
        }
      }
    } else {
      alert('Incorrect password');
      setAdminPassword('');
    }
  };

  useEffect(() => {
    // Try to load all spaces on mount
    fetchSpaces();
  }, []);

  if (showLogin && !loggedInAgent) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>📋 Todo List Dashboard</h1>
          <form onSubmit={handleLogin}>
            <input type="email" name="email" placeholder="Email" required />
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>
          {error && <div className="error">{error}</div>}
          <div className="or-divider">OR</div>
          <div className="load-all-section">
            <input
              type="text"
              placeholder="Enter agent name (optional)"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
            <button onClick={handleLoadByAgent}>Load All Spaces</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📋 My Todo Spaces</h1>
        <div className="header-controls">
          {loggedInAgent && (
            <div className="user-info">
              <span>Welcome, <strong>{loggedInAgent.name}</strong></span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
          <button className="admin-btn" onClick={handleAdminClick} title="Admin Panel">
            ⚙️ Admin
          </button>
          <button className="refresh-btn" onClick={() => fetchSpaces(loggedInAgent?.name || agentName)}>
            🔄 Refresh
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loggedInAgent && <StatsDashboard agentName={loggedInAgent.name} />}

      {loading ? (
        <div className="loading-container">
          <div className="loading">Loading spaces...</div>
        </div>
      ) : spaces.length === 0 ? (
        <div className="empty-state">
          <h2>No spaces found</h2>
          <p>Create a space to get started!</p>
          {loggedInAgent && (
            <button className="primary-btn" onClick={() => setShowAddSpaceModal(true)}>
              + Create Space
            </button>
          )}
        </div>
      ) : (
        <div className="spaces-section">
          {loggedInAgent && (
            <button 
              className="add-space-btn"
              onClick={() => setShowAddSpaceModal(true)}
            >
              + Add New Space
            </button>
          )}
          <div className="spaces-grid">
            {spaces.map(space => (
              <SpaceBox 
                key={space._id} 
                space={space}
                onSpaceDeleted={handleSpaceDeleted}
              />
            ))}
          </div>
        </div>
      )}

      <AddSpaceModal
        isOpen={showAddSpaceModal}
        onClose={() => setShowAddSpaceModal(false)}
        onSpaceAdded={handleSpaceAdded}
        agentId={loggedInAgent?._id}
      />

      {/* Admin Password Modal */}
      {showAdminPrompt && (
        <div className="modal-overlay" onClick={() => setShowAdminPrompt(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Admin Access</h2>
              <button className="modal-close" onClick={() => setShowAdminPrompt(false)}>×</button>
            </div>
            <form onSubmit={handleAdminSubmit}>
              <div className="form-group">
                <label>Admin Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAdminPrompt(false)}>Cancel</button>
                <button type="submit">Access Admin Panel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
