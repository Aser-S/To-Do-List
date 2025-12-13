import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

function StatsDashboard({ agentName }) {
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
        
        // Fetch spaces
        const spacesResponse = await fetch(
          `${API_BASE}/spaces/agent/name/${encodeURIComponent(agentName)}`
        );
        const spacesData = await spacesResponse.json();
        const spaces = spacesData.data || [];

        // Fetch all checklists
        const checklistsResponse = await fetch(`${API_BASE}/checklists`);
        const checklistsData = await checklistsResponse.json();
        const checklists = checklistsData.data || [];

        // Fetch all items
        const itemsResponse = await fetch(`${API_BASE}/items`);
        const itemsData = await itemsResponse.json();
        const items = itemsData.data || [];

        // Fetch all steps
        const stepsResponse = await fetch(`${API_BASE}/steps`);
        const stepsData = await stepsResponse.json();
        const steps = stepsData.data || [];

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
  }, [agentName]);

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
