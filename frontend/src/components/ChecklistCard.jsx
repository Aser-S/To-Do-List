import { useState, useEffect } from 'react';
import ItemCard from './ItemCard';
import AddItemModal from './AddItemModal';

const API_BASE = 'http://localhost:5000/api';

function ChecklistCard({ checklist, onItemProgressChange, onStepStatusChange, onChecklistDeleted }) {
  const [expanded, setExpanded] = useState(true);
  const [items, setItems] = useState(checklist.items || []);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Fetch items for this checklist if not fully populated
    if (expanded && (!items || items.length === 0 || !items[0].steps)) {
      fetch(`${API_BASE}/items/checklist/${encodeURIComponent(checklist.checklist_title)}`)
        .then(r => r.json())
        .then(result => {
          if (result.success && result.data) {
            setItems(result.data);
          }
        })
        .catch(err => console.error('Error fetching items:', err));
    }
  }, [expanded, checklist.checklist_title]);

  const handleProgressChange = async (itemId, progress) => {
    try {
      const response = await fetch(`${API_BASE}/items/${itemId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress })
      });
      const result = await response.json();
      if (result.success) {
        setItems(items.map(i => i._id === itemId ? { ...i, progress, status: result.data.status } : i));
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const handleDeleteChecklist = async () => {
    if (window.confirm(`Delete checklist "${checklist.checklist_title}" and all its items?`)) {
      setDeleting(true);
      try {
        const response = await fetch(
          `${API_BASE}/checklists/title/${encodeURIComponent(checklist.checklist_title)}`,
          { method: 'DELETE' }
        );
        const result = await response.json();
        if (result.success) {
          onChecklistDeleted && onChecklistDeleted(checklist._id);
        } else {
          alert(result.message || 'Failed to delete checklist');
        }
      } catch (err) {
        alert('Error deleting checklist: ' + err.message);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleItemDeleted = (itemId) => {
    setItems(items.filter(i => i._id !== itemId));
  };

  const handleItemAdded = (newItem) => {
    setItems([...items, newItem]);
  };

  const totalItems = items.length;
  const completedItems = items.filter(i => i.status === 'Completed').length;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="checklist-card">
      <div className="checklist-header" onClick={() => setExpanded(!expanded)}>
        <h3 className="checklist-title">{checklist.checklist_title}</h3>
        <div className="checklist-stats">
          <span className="completion-rate">{completionRate}%</span>
          <span className="items-count">{completedItems}/{totalItems} items</span>
          <button 
            className="delete-btn" 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteChecklist();
            }} 
            disabled={deleting}
            title="Delete checklist"
          >
            🗑️
          </button>
          <button className="expand-btn" onClick={(e) => e.stopPropagation()}>{expanded ? '−' : '+'}</button>
        </div>
      </div>
      
      {expanded && (
        <div className="checklist-items">
          {items.length === 0 ? (
            <p className="empty-message">No items in this checklist</p>
          ) : (
            items.map(item => (
              <ItemCard
                key={item._id}
                item={item}
                onProgressChange={handleProgressChange}
                onStepStatusChange={() => {}}
                onItemDeleted={handleItemDeleted}
              />
            ))
          )}
          <button 
            className="add-btn"
            onClick={() => setShowAddItemModal(true)}
          >
            + Add Item
          </button>
        </div>
      )}

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onItemAdded={handleItemAdded}
        checklistName={checklist.checklist_title}
      />
    </div>
  );
}

export default ChecklistCard;
