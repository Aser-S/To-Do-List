import { useState, useEffect } from 'react';
import CategoryManager from './CategoryManager';

const API_BASE = 'http://localhost:5000/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('agents');
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/agents`);
      const result = await response.json();
      if (result.success) {
        setAgents(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch agents');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('All fields are required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        setAgents([...agents, result.data]);
        setFormData({ name: '', email: '', password: '' });
        setShowAddModal(false);
        setError('');
      } else {
        setError(result.message || 'Failed to create agent');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    if (!editingAgent.name.trim()) {
      setError('Agent name is required');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/agents/name/${encodeURIComponent(editingAgent.name)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editingAgent.name,
            email: editingAgent.email
          })
        }
      );
      const result = await response.json();
      if (result.success) {
        setAgents(agents.map(a => a._id === editingAgent._id ? result.data : a));
        setEditingAgent(null);
        setError('');
      } else {
        setError(result.message || 'Failed to update agent');
      }
    } catch (err) {
      setError(err.message);
    }
  };



  if (loading) {
    return <div className="admin-panel"><div className="loading">Loading agents...</div></div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            👤 Agents
          </button>
          <button 
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🏷️ Categories
          </button>
        </div>
      </div>

      {activeTab === 'agents' && (
        <>
          <div className="section-header">
            <h3>Agent Management</h3>
            <button className="primary-btn" onClick={() => setShowAddModal(true)}>
              + Add Agent
            </button>
          </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="agents-table-container">
        {agents.length === 0 ? (
          <p className="empty-message">No agents found</p>
        ) : (
          <table className="agents-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Spaces</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent._id}>
                  <td>{agent.name}</td>
                  <td>{agent.email}</td>
                  <td>{agent.spaces?.length || 0}</td>
                  <td className="actions">
                    <button 
                      className="edit-btn"
                      onClick={() => setEditingAgent(agent)}
                      title="Edit agent"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Agent</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddAgent}>
              <div className="form-group">
                <label>Agent Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder="Set password"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit">Create Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {editingAgent && (
        <div className="modal-overlay" onClick={() => setEditingAgent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Agent</h2>
              <button className="modal-close" onClick={() => setEditingAgent(null)}>×</button>
            </div>
            <form onSubmit={handleUpdateAgent}>
              <div className="form-group">
                <label>Agent Name *</label>
                <input
                  type="text"
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={editingAgent.email}
                  onChange={(e) => setEditingAgent({ ...editingAgent, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setEditingAgent(null)}>Cancel</button>
                <button type="submit">Update Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === 'categories' && (
        <CategoryManager />
      )}
    </div>
  );
}

export default AdminPanel;
