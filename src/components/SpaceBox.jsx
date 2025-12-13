import { useState, useEffect } from 'react';
import ChecklistCard from './ChecklistCard';
import AddChecklistModal from './AddChecklistModal';

const API_BASE = 'http://localhost:5000/api';

function SpaceBox({ space, onChecklistUpdate, onSpaceDeleted }) {
  const [expanded, setExpanded] = useState(true);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (expanded) {
      setLoading(true);
      fetch(`${API_BASE}/checklists/space/${encodeURIComponent(space.space_title)}`)
        .then(r => r.json())
        .then(result => {
          if (result.success) {
            setChecklists(result.data || []);
          }
        })
        .catch(err => console.error('Error fetching checklists:', err))
        .finally(() => setLoading(false));
    }
  }, [expanded, space.space_title]);

  const handleDeleteSpace = async () => {
    if (window.confirm(`Delete space "${space.space_title}" and all its checklists?`)) {
      setDeleting(true);
      try {
        const response = await fetch(
          `${API_BASE}/spaces/title/${encodeURIComponent(space.space_title)}`,
          { method: 'DELETE' }
        );
        const result = await response.json();
        if (result.success) {
          onSpaceDeleted && onSpaceDeleted(space._id);
        } else {
          alert(result.message || 'Failed to delete space');
        }
      } catch (err) {
        alert('Error deleting space: ' + err.message);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleChecklistDeleted = (checklistId) => {
    setChecklists(checklists.filter(c => c._id !== checklistId));
  };

  const handleChecklistAdded = (newChecklist) => {
    setChecklists([...checklists, newChecklist]);
  };

  return (
    <div className="space-box">
      <div className="space-header" onClick={() => setExpanded(!expanded)}>
        <h2 className="space-title">{space.space_title}</h2>
        <div className="space-meta">
          <span className="checklists-count">{checklists.length} checklists</span>
          <button 
            className="delete-btn" 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSpace();
            }} 
            disabled={deleting}
            title="Delete space"
          >
            🗑️
          </button>
          <button className="expand-btn" onClick={(e) => e.stopPropagation()}>{expanded ? '−' : '+'}</button>
        </div>
      </div>
      
      {expanded && (
        <div className="space-content">
          {loading ? (
            <div className="loading">Loading checklists...</div>
          ) : checklists.length === 0 ? (
            <p className="empty-message">No checklists in this space</p>
          ) : (
            checklists.map(checklist => (
              <ChecklistCard
                key={checklist._id}
                checklist={checklist}
                onItemProgressChange={() => {}}
                onStepStatusChange={() => {}}
                onChecklistDeleted={handleChecklistDeleted}
              />
            ))
          )}
          <button 
            className="add-btn"
            onClick={() => setShowAddChecklistModal(true)}
          >
            + Add Checklist
          </button>
        </div>
      )}

      <AddChecklistModal
        isOpen={showAddChecklistModal}
        onClose={() => setShowAddChecklistModal(false)}
        onChecklistAdded={handleChecklistAdded}
        spaceName={space.space_title}
      />
    </div>
  );
}

export default SpaceBox;
