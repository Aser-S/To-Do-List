import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

function StatsDashboard({ agentName, refreshTrigger }) {
  const [stats, setStats] = useState({
    totalSpaces: 0,
    totalChecklists: 0,
    totalItems: 0,
    totalSteps: 0,
    completedItems: 0,
    completedSteps: 0,
    completionPercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch spaces for the current agent
        const spacesResponse = await fetch(
          `${API_BASE}/spaces/agent/name/${encodeURIComponent(agentName)}`
        );
        const spacesData = await spacesResponse.json();
        const spaces = spacesData.data || [];

        if (spaces.length === 0) {
          setStats({
            totalSpaces: 0,
            totalChecklists: 0,
            totalItems: 0,
            totalSteps: 0,
            completedItems: 0,
            completedSteps: 0,
            completionPercentage: 0
          });
          setLoading(false);
          return;
        }

        // Get all space IDs for this agent
        const spaceIds = spaces.map(space => space._id);

        // Fetch checklists for agent's spaces using space_id filter
        const checklistPromises = spaceIds.map(spaceId =>
          fetch(`${API_BASE}/checklists?space_id=${spaceId}`)
            .then(r => r.json())
            .then(result => result.data || [])
            .catch(() => [])
        );
        const checklistArrays = await Promise.all(checklistPromises);
        const checklists = checklistArrays.flat();

        if (checklists.length === 0) {
          setStats({
            totalSpaces: spaces.length,
            totalChecklists: 0,
            totalItems: 0,
            totalSteps: 0,
            completedItems: 0,
            completedSteps: 0,
            completionPercentage: 0
          });
          setLoading(false);
          return;
        }

        // Get all checklist IDs
        const checklistIds = checklists.map(checklist => checklist._id);

        // Fetch items for agent's checklists
        const itemPromises = checklists.map(checklist =>
          fetch(`${API_BASE}/items/checklist/${encodeURIComponent(checklist.checklist_title)}`)
            .then(r => r.json())
            .then(result => result.data || [])
            .catch(() => [])
        );
        const itemArrays = await Promise.all(itemPromises);
        const items = itemArrays.flat();

        // Fetch steps for agent's items
        let steps = [];
        if (items.length > 0) {
          const stepPromises = items.map(item =>
            fetch(`${API_BASE}/steps/item/${encodeURIComponent(item.name)}`)
              .then(r => r.json())
              .then(result => result.steps || [])
              .catch(() => [])
          );
          const stepArrays = await Promise.all(stepPromises);
          steps = stepArrays.flat();
        }

        const completedItems = items.filter(i => i.status === 'Completed').length;
        const completedSteps = steps.filter(s => s.status === 'Completed').length;
        const completionPercentage = items.length > 0 
          ? Math.round((completedItems / items.length) * 100) 
          : 0;

        setStats({
          totalSpaces: spaces.length,
          totalChecklists: checklists.length,
          totalItems: items.length,
          totalSteps: steps.length,
          completedItems,
          completedSteps,
          completionPercentage
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (agentName) {
      fetchStats();
    }
  }, [agentName, refreshTrigger]);

  if (loading) {
    return <div className="stats-dashboard loading">Loading statistics...</div>;
  }

  return (
    <div className="stats-dashboard">
      <h3>📊 Statistics Dashboard</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalSpaces}</div>
          <div className="stat-label">Spaces</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalChecklists}</div>
          <div className="stat-label">Checklists</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalItems}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedItems}</div>
          <div className="stat-label">Completed Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalSteps}</div>
          <div className="stat-label">Total Steps</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedSteps}</div>
          <div className="stat-label">Completed Steps</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">{stats.completionPercentage}%</div>
          <div className="stat-label">Overall Progress</div>
        </div>
      </div>
    </div>
  );
}

export default StatsDashboard;
