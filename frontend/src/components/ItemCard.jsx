import { useState, useEffect } from 'react';
import StepItem from './StepItem';
import AddStepModal from './AddStepModal';

const API_BASE = 'http://localhost:5000/api';

function ItemCard({ item, onProgressChange, onStepStatusChange, onItemDeleted, onStatsRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [steps, setSteps] = useState(item.steps || []);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categoryName, setCategoryName] = useState(null);

  useEffect(() => {
    // Fetch steps for this item if not already loaded
    if (expanded && (!steps || steps.length === 0)) {
      fetch(`${API_BASE}/steps/item/${encodeURIComponent(item.name)}`)
        .then(r => r.json())
        .then(result => {
          if (result.success && result.steps) {
            setSteps(result.steps);
          }
        })
        .catch(err => console.error('Error fetching steps:', err));
    }
  }, [expanded, item.name, steps]);

  useEffect(() => {
    // Fetch category name if category_id exists but category_name is not populated
    if (item.category_id && typeof item.category_id === 'string' && categoryName === null) {
      // Fetch all categories and find the matching one
      fetch(`${API_BASE}/categories`)
        .then(r => r.json())
        .then(result => {
          if (result.success && result.data) {
            const category = result.data.find(cat => cat._id === item.category_id);
            if (category) {
              setCategoryName(category.category_name);
            } else {
              setCategoryName('Unknown Category');
            }
          } else {
            setCategoryName('Unknown Category');
          }
        })
        .catch(err => {
          console.error('Error fetching categories:', err);
          setCategoryName('Unknown Category');
        });
    }
  }, [item.category_id, categoryName]);

  const handleStepStatusChange = async (stepId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/steps/${stepId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        setSteps(steps.map(s => s._id === stepId ? { ...s, status: newStatus } : s));
        onStepStatusChange && onStepStatusChange();
        onStatsRefresh && onStatsRefresh();
      }
    } catch (err) {
      console.error('Error updating step:', err);
    }
  };

  const handleDeleteItem = async () => {
    if (window.confirm(`Delete item "${item.name}" and all its steps?`)) {
      setDeleting(true);
      try {
        const response = await fetch(
          `${API_BASE}/items/name/${encodeURIComponent(item.name)}`,
          { method: 'DELETE' }
        );
        const result = await response.json();
        if (result.success) {
          onItemDeleted && onItemDeleted(item._id);
        } else {
          alert(result.message || 'Failed to delete item');
        }
      } catch (err) {
        alert('Error deleting item: ' + err.message);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleStepDeleted = (stepId) => {
    setSteps(steps.filter(s => s._id !== stepId));
    onStatsRefresh && onStatsRefresh();
  };

  const handleStepAdded = (newStep) => {
    setSteps([...steps, newStep]);
    onStatsRefresh && onStatsRefresh();
  };

  const progress = item.progress || 0;
  const hasSteps = steps && steps.length > 0;
  const completedSteps = steps ? steps.filter(s => s.status === 'Completed').length : 0;
  const totalSteps = steps ? steps.length : 0;

  return (
    <div className={`item-card ${item.status?.toLowerCase().replace(' ', '-')}`}>
      <div className="item-header" onClick={() => setExpanded(!expanded)}>
        <div className="item-info">
          <h4 className="item-name">{item.name}</h4>
          {item.description && <p className="item-description">{item.description}</p>}
          <div className="item-meta">
            {item.priority && (
              <span className={`priority-badge priority-${item.priority.toLowerCase()}`}>
                {item.priority}
              </span>
            )}
            {item.category_id && (
              <span className="category-badge">
                {typeof item.category_id === 'object' 
                  ? item.category_id.category_name 
                  : categoryName || 'Category'}
              </span>
            )}
            {item.deadline && (
              <span className="deadline-badge">
                Due: {new Date(item.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="item-status-section">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <span className="progress-text">{progress}%</span>
          </div>
          <span className={`status-badge status-${item.status?.toLowerCase().replace(' ', '-')}`}>
            {item.status || 'Pending'}
          </span>
          {hasSteps && (
            <span className="steps-indicator">
              {completedSteps}/{totalSteps} steps
            </span>
          )}
          <button 
            className="delete-btn" 
            onClick={handleDeleteItem} 
            disabled={deleting}
            title="Delete item"
          >
            🗑️
          </button>
          <button className="expand-btn">{expanded ? '−' : '+'}</button>
        </div>
      </div>
      
      {expanded && (
        <div className="item-details">
          <div className="item-details-info">
            <div className="detail-row">
              <label>Category:</label>
              <span className="detail-value">
                {item.category_id 
                  ? (typeof item.category_id === 'object' 
                      ? item.category_id.category_name 
                      : categoryName || 'Category')
                  : 'No Category'}
              </span>
            </div>
            {item.deadline && (
              <div className="detail-row">
                <label>Deadline:</label>
                <span className="detail-value">
                  {new Date(item.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="progress-control">
            <label>Progress: </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                const newProgress = parseInt(e.target.value);
                onProgressChange(item._id, newProgress);
              }}
            />
            <span>{progress}%</span>
          </div>
          
          <div className="steps-container">
            <div className="steps-header">
              <h5>Steps:</h5>
              <button 
                className="add-btn" 
                onClick={() => setShowAddStepModal(true)}
                title="Add step"
              >
                + Add Step
              </button>
            </div>
            {hasSteps ? (
              steps.map(step => (
                <StepItem
                  key={step._id}
                  step={step}
                  onStatusChange={handleStepStatusChange}
                  onStepDeleted={handleStepDeleted}
                />
              ))
            ) : (
              <p className="empty-message">No steps yet. Add one to get started!</p>
            )}
          </div>

          <AddStepModal
            isOpen={showAddStepModal}
            onClose={() => setShowAddStepModal(false)}
            onStepAdded={handleStepAdded}
            itemName={item.name}
          />
        </div>
      )}
    </div>
  );
}

export default ItemCard;
