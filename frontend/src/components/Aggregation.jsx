import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

function AggregationsPage({ loggedInAgent, spaces }) {
  const [agentReport, setAgentReport] = useState(null);
  const [deadlineReport, setDeadlineReport] = useState(null);
  const [spaceReport, setSpaceReport] = useState(null);
  const [checklistReport, setChecklistReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const calculateAgentProductivity = async () => {
    if (!loggedInAgent?.name) return;
    
    try {
      // Fetch agent's spaces
      const spacesResponse = await fetch(`${API_BASE}/spaces/agent/name/${encodeURIComponent(loggedInAgent.name)}`);
      const spacesData = await spacesResponse.json();
      const agentSpaces = spacesData.data || [];

      let totalItems = 0;
      let completedItems = 0;
      let totalSteps = 0;
      let completedSteps = 0;
      let overdueItems = 0;
      let highPriorityItems = 0;

      // Process each space
      for (const space of agentSpaces) {
        // Get checklists for this space
        const checklistsResponse = await fetch(`${API_BASE}/checklists?space_id=${space._id}`);
        const checklistsData = await checklistsResponse.json();
        const checklists = checklistsData.data || [];

        // Process each checklist
        for (const checklist of checklists) {
          const itemsResponse = await fetch(`${API_BASE}/items/checklist/${encodeURIComponent(checklist.checklist_title)}`);
          const itemsData = await itemsResponse.json();
          const items = itemsData.data || [];

          totalItems += items.length;
          completedItems += items.filter(item => item.status === 'Completed').length;
          highPriorityItems += items.filter(item => item.priority === 'High').length;
          overdueItems += items.filter(item => 
            item.deadline && 
            new Date(item.deadline) < new Date() && 
            item.status !== 'Completed'
          ).length;

          // Count steps for each item
          for (const item of items) {
            const stepsResponse = await fetch(`${API_BASE}/steps/item/${encodeURIComponent(item.name)}`);
            const stepsData = await stepsResponse.json();
            const steps = stepsData.steps || [];
            
            totalSteps += steps.length;
            completedSteps += steps.filter(step => step.status === 'Completed').length;
          }
        }
      }

      const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      const stepCompletionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      setAgentReport({
        statistics: {
          'Total Spaces': agentSpaces.length,
          'Total Items': totalItems,
          'Completed Items': completedItems,
          'Completion Rate': `${completionRate}%`,
          'Total Steps': totalSteps,
          'Completed Steps': completedSteps,
          'Step Completion Rate': `${stepCompletionRate}%`,
          'High Priority Items': highPriorityItems,
          'Overdue Items': overdueItems
        }
      });
    } catch (error) {
      console.error('Error calculating agent productivity:', error);
    }
  };

  const calculateDeadlineAnalysis = async () => {
    if (!loggedInAgent?.name) return;

    try {
      // Fetch agent's spaces and their items
      const spacesResponse = await fetch(`${API_BASE}/spaces/agent/name/${encodeURIComponent(loggedInAgent.name)}`);
      const spacesData = await spacesResponse.json();
      const agentSpaces = spacesData.data || [];

      let itemsWithDeadlines = [];
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (const space of agentSpaces) {
        const checklistsResponse = await fetch(`${API_BASE}/checklists?space_id=${space._id}`);
        const checklistsData = await checklistsResponse.json();
        const checklists = checklistsData.data || [];

        for (const checklist of checklists) {
          const itemsResponse = await fetch(`${API_BASE}/items/checklist/${encodeURIComponent(checklist.checklist_title)}`);
          const itemsData = await itemsResponse.json();
          const items = itemsData.data || [];
          
          itemsWithDeadlines.push(...items.filter(item => item.deadline));
        }
      }

      const overdue = itemsWithDeadlines.filter(item => 
        new Date(item.deadline) < today && item.status !== 'Completed'
      ).length;

      const dueThisWeek = itemsWithDeadlines.filter(item => {
        const deadline = new Date(item.deadline);
        return deadline >= today && deadline <= nextWeek && item.status !== 'Completed';
      }).length;

      const completed = itemsWithDeadlines.filter(item => item.status === 'Completed').length;

      setDeadlineReport({
        overallStatistics: {
          'Total Items with Deadlines': itemsWithDeadlines.length,
          'Overdue Items': overdue,
          'Due This Week': dueThisWeek,
          'Completed on Time': completed,
          'On Track Items': itemsWithDeadlines.length - overdue - dueThisWeek - completed
        }
      });
    } catch (error) {
      console.error('Error calculating deadline analysis:', error);
    }
  };

  const calculateSpaceOverview = () => {
    const overview = spaces.map(space => ({
      name: space.space_title || space.spaceTitle,
      checklists: space.checklists?.length || 0,
      id: space._id
    }));

    setSpaceReport(overview);
  };

  const calculateChecklistProgress = async (checklistId, checklistTitle) => {
    try {
      const itemsResponse = await fetch(`${API_BASE}/items/checklist/${encodeURIComponent(checklistTitle)}`);
      const itemsData = await itemsResponse.json();
      const items = itemsData.data || [];

      const totalItems = items.length;
      const completedItems = items.filter(item => item.status === 'Completed').length;
      const inProgressItems = items.filter(item => item.status === 'In Progress').length;
      const pendingItems = items.filter(item => item.status === 'Pending').length;

      let totalSteps = 0;
      let completedSteps = 0;

      for (const item of items) {
        const stepsResponse = await fetch(`${API_BASE}/steps/item/${encodeURIComponent(item.name)}`);
        const stepsData = await stepsResponse.json();
        const steps = stepsData.steps || [];
        
        totalSteps += steps.length;
        completedSteps += steps.filter(step => step.status === 'Completed').length;
      }

      const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      setChecklistReport({
        statistics: {
          'Checklist': checklistTitle,
          'Total Items': totalItems,
          'Completed Items': completedItems,
          'In Progress Items': inProgressItems,
          'Pending Items': pendingItems,
          'Completion Rate': `${completionRate}%`,
          'Total Steps': totalSteps,
          'Completed Steps': completedSteps
        }
      });
    } catch (error) {
      console.error('Error calculating checklist progress:', error);
    }
  };

  useEffect(() => {
    if (!loggedInAgent) return;
    
    setLoading(true);
    Promise.all([
      calculateAgentProductivity(),
      calculateDeadlineAnalysis(),
      calculateSpaceOverview()
    ]).finally(() => {
      setLoading(false);
    });
  }, [loggedInAgent, spaces]);

  if (loading) {
    return (
      <div className="aggregations-page">
        <h2>Aggregations Dashboard</h2>
        <div className="loading-container">
          <div className="loading">Calculating analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="aggregations-page">
      <h2>Aggregations Dashboard</h2>

      <div className="aggregations-section">
        <div className="aggregations-card">
          <h3>📈 Agent Productivity</h3>
          {agentReport ? (
            <table className="report-table">
              <tbody>
                {Object.entries(agentReport.statistics).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-message">No productivity data available.</p>}
        </div>

        <div className="aggregations-card">
          <h3>⏰ Deadline Analysis</h3>
          {deadlineReport ? (
            <table className="report-table">
              <tbody>
                {Object.entries(deadlineReport.overallStatistics).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-message">No deadline data available.</p>}
        </div>

        <div className="aggregations-card">
          <h3>🏢 Space Overview</h3>
          {spaceReport && spaceReport.length > 0 ? (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Space Name</th>
                  <th>Checklists</th>
                </tr>
              </thead>
              <tbody>
                {spaceReport.map(space => (
                  <tr key={space.id}>
                    <td>{space.name}</td>
                    <td>{space.checklists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-message">No spaces available.</p>}
        </div>

        <div className="aggregations-card">
          <h3>✅ Checklist Progress</h3>
          {spaces && spaces.length > 0 ? (
            <>
              {spaces.map(space => (
                <div key={space._id} className="space-section">
                  <h4>{space.space_title || space.spaceTitle}</h4>
                  <div className="checklist-buttons">
                    {space.checklists?.map(cl => (
                      <button
                        key={cl._id}
                        className="primary-btn"
                        onClick={() => calculateChecklistProgress(cl._id, cl.checklist_title)}
                      >
                        {cl.checklist_title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {checklistReport && (
                <div className="checklist-results">
                  <h4>📊 Selected Checklist Analysis</h4>
                  <table className="report-table">
                    <tbody>
                      {Object.entries(checklistReport.statistics).map(([key, value]) => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : <p className="empty-message">No checklists available.</p>}
        </div>
      </div>
    </div>
  );
}

export default AggregationsPage;