import { useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

function StepItem({ step, onStatusChange, onStepDeleted }) {
  const isCompleted = step.status === 'Completed';
  const [deleting, setDeleting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Delete step "${step.step_name}"?`)) {
      setDeleting(true);
      try {
        const response = await fetch(
          `${API_BASE}/steps/name/${encodeURIComponent(step.step_name)}`,
          { method: 'DELETE' }
        );
        const result = await response.json();
        if (result.success) {
          onStepDeleted && onStepDeleted(step._id);
        } else {
          alert(result.message || 'Failed to delete step');
        }
      } catch (err) {
        alert('Error deleting step: ' + err.message);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="step-item">
      <label className="step-checkbox">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={(e) => {
            const newStatus = e.target.checked ? 'Completed' : 'Pending';
            onStatusChange(step._id, newStatus);
          }}
        />
        <span className={`step-name ${isCompleted ? 'completed' : ''}`}>
          {step.step_name}
        </span>
      </label>
      <div className="step-actions">
        <div className="step-status-container">
          {showStatusDropdown ? (
            <select 
              value={step.status} 
              onChange={(e) => {
                onStatusChange(step._id, e.target.value);
                setShowStatusDropdown(false);
              }}
              onBlur={() => setShowStatusDropdown(false)}
              autoFocus
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Urgent">Urgent</option>
            </select>
          ) : (
            <span 
              className={`step-status ${step.status.toLowerCase().replace(' ', '-')}`}
              onClick={() => setShowStatusDropdown(true)}
              title="Click to change status"
            >
              {step.status}
            </span>
          )}
        </div>
        <button 
          className="delete-btn" 
          onClick={handleDelete} 
          disabled={deleting}
          title="Delete step"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default StepItem;
