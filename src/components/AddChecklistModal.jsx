import { useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

function AddChecklistModal({ isOpen, onClose, onChecklistAdded, spaceName }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Checklist title is required');
      return;
    }

    if (!spaceName) {
      setError('Space not found.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist_title: title.trim(),
          space_title: spaceName
        })
      });

      const result = await response.json();
      if (result.success) {
        setTitle('');
        onChecklistAdded && onChecklistAdded(result.data);
        onClose();
      } else {
        setError(result.message || 'Failed to create checklist');
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
          <h2>Create New Checklist</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Checklist Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Development Tasks"
              required
            />
          </div>
          <div className="form-info">Space: <strong>{spaceName}</strong></div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddChecklistModal;
