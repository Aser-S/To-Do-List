import { useState, useEffect } from 'react';
import AddCategoryModal from './AddCategoryModal';

const API_BASE = 'http://localhost:5000/api';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/categories`);
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryAdded = (newCategory) => {
    setCategories([...categories, newCategory]);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditName(category.category_name);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/categories/name/${encodeURIComponent(editingCategory.category_name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: editName.trim() })
      });

      const result = await response.json();
      if (result.success) {
        setCategories(categories.map(cat => 
          cat._id === editingCategory._id ? result.data : cat
        ));
        setEditingCategory(null);
        setEditName('');
        setError('');
      } else {
        setError(result.message || 'Failed to update category');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Delete category "${category.category_name}"? This will remove the category from all items.`)) {
      try {
        const response = await fetch(`${API_BASE}/categories/name/${encodeURIComponent(category.category_name)}`, {
          method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
          setCategories(categories.filter(cat => cat._id !== category._id));
        } else {
          setError(result.message || 'Failed to delete category');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="category-manager">
      <div className="admin-header">
        <h2>Category Management</h2>
        <button 
          className="add-space-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Category
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="categories-table-container">
        <table className="agents-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Items Count</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category._id}>
                <td>
                  {editingCategory?._id === category._id ? (
                    <form onSubmit={handleUpdateCategory} style={{ display: 'inline-flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                      />
                      <button type="submit" style={{ padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
                        ✓
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditingCategory(null)}
                        style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
                      >
                        ✗
                      </button>
                    </form>
                  ) : (
                    category.category_name
                  )}
                </td>
                <td>{category.items?.length || 0}</td>
                <td>{new Date(category.created_at).toLocaleDateString()}</td>
                <td className="actions">
                  {editingCategory?._id !== category._id && (
                    <>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditCategory(category)}
                        title="Edit category"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteCategory(category)}
                        title="Delete category"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddCategoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCategoryAdded={handleCategoryAdded}
      />
    </div>
  );
}

export default CategoryManager;