import { useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

function AddItemModal({ isOpen, onClose, onItemAdded, checklistName }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    status: 'Pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }

    if (!checklistName) {
      setError('Checklist not found.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, get the checklist to retrieve its ID
      const checklistResponse = await fetch(
        `${API_BASE}/checklists/title/${encodeURIComponent(checklistName)}`
      );
      const checklistResult = await checklistResponse.json();
      
      if (!checklistResult.success) {
        setError('Checklist not found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          checklist_id: checklistResult.data._id,
          progress: 0,
          category_id: null
        })
      });

      const result = await response.json();
      if (result.success) {
        setFormData({
          name: '',
          description: '',
          priority: 'Medium',
          deadline: '',
          status: 'Pending'
        });
        onItemAdded && onItemAdded(result.data);
        onClose();
      } else {
        setError(result.message || 'Failed to create item');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Item</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Item name"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Item description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-info">Checklist: <strong>{checklistName}</strong></div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddItemModal;
