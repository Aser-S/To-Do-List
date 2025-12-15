import { useState } from 'react';
import { createPortal } from 'react-dom';

const API_BASE = 'http://localhost:5000/api';

function AddStepModal({ isOpen, onClose, onStepAdded, itemName }) {
  const [stepName, setStepName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stepName.trim()) {
      setError('Step name is required');
      return;
    }

    if (!itemName) {
      setError('Item not found.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, get the item to retrieve its ID
      const itemResponse = await fetch(
        `${API_BASE}/items/name/${encodeURIComponent(itemName)}`
      );
      const itemResult = await itemResponse.json();
      
      if (!itemResult.success) {
        setError('Item not found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_name: stepName.trim(),
          item_id: itemResult.data._id
        })
      });

      const result = await response.json();
      if (result.success) {
        setStepName('');
        onStepAdded && onStepAdded(result.data);
        onClose();
      } else {
        setError(result.message || 'Failed to create step');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Step</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Step Name *</label>
            <input
              type="text"
              value={stepName}
              onChange={(e) => setStepName(e.target.value)}
              placeholder="Describe the step to complete"
              required
            />
          </div>

          <div className="form-info">Item: <strong>{itemName}</strong></div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Step'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default AddStepModal;
