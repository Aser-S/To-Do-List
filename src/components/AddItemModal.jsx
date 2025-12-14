import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AddCategoryModal from './AddCategoryModal';

const API_BASE = 'http://localhost:5000/api';

function AddItemModal({ isOpen, onClose, onItemAdded, checklistName }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    status: 'Pending',
    category_id: ''
  });
  const [steps, setSteps] = useState(['']);
  const [categories, setCategories] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCategoryAdded = (newCategory) => {
    setCategories([...categories, newCategory]);
    setFormData(prev => ({ ...prev, category_id: newCategory._id }));
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
          category_id: formData.category_id || null
        })
      });

      const result = await response.json();
      if (result.success) {
        // Create steps if any were provided
        const validSteps = steps.filter(step => step.trim() !== '');
        if (validSteps.length > 0) {
          for (const stepName of validSteps) {
            try {
              await fetch(`${API_BASE}/steps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  step_name: stepName.trim(),
                  item_id: result.data._id
                })
              });
            } catch (stepError) {
              console.error('Error creating step:', stepError);
            }
          }
        }

        setFormData({
          name: '',
          description: '',
          priority: 'Medium',
          deadline: '',
          status: 'Pending',
          category_id: ''
        });
        setSteps(['']);
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

  return createPortal(
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
              <label>Category</label>
              <div className="category-input-group">
                <select name="category_id" value={formData.category_id} onChange={handleChange}>
                  <option value="">No Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => setShowAddCategoryModal(true)}
                  className="add-category-btn"
                  title="Create new category"
                >
                  +
                </button>
              </div>
            </div>
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

          <div className="form-group">
            <label>Initial Steps (Optional)</label>
            {steps.map((step, index) => (
              <div key={index} className="step-input-row">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                />
                {steps.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeStep(index)}
                    className="remove-step-btn"
                    title="Remove step"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={addStep}
              className="add-step-btn"
            >
              + Add Step
            </button>
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
      
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCategoryAdded={handleCategoryAdded}
      />
    </div>,
    document.body
  );
}

export default AddItemModal;
