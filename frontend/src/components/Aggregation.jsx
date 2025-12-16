import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api/aggregations';

function AggregationsPage({ loggedInAgent, spaces }) {
  const [agentReport, setAgentReport] = useState(null);
  const [deadlineReport, setDeadlineReport] = useState(null);
  const [spaceReport, setSpaceReport] = useState(null);
  const [checklistReport, setChecklistReport] = useState(null);

  
  const fetchAgentProductivity = async () => {
    if (!loggedInAgent?._id) return;
    const url = `${API_BASE}/agent/${loggedInAgent._id}/productivity`;
    const res = await fetch(url);
    const json = await res.json();
    setAgentReport(json.data);
  };

  const fetchDeadlineAnalysis = async () => {
    const url = `${API_BASE}/deadline/analysis`;
    const res = await fetch(url);
    const json = await res.json();
    setDeadlineReport(json.data);
  };

  const fetchSpaceOverview = async () => {
    const url = `${API_BASE}/space/overview`;
    const res = await fetch(url);
    const json = await res.json();
    setSpaceReport(json.data);
  };

  const fetchChecklistProgress = async (checklistId) => {
    const url = `${API_BASE}/checklist/${checklistId}/progress`;
    const res = await fetch(url);
    const json = await res.json();
    setChecklistReport(json.data);
  };

  
  useEffect(() => {
    if (!loggedInAgent) return;
    fetchAgentProductivity();
    fetchDeadlineAnalysis();
    fetchSpaceOverview();
  }, [loggedInAgent]);

  
  return (
    <div className="aggregations-page">
      <h2>Aggregations Dashboard</h2>

      <div className="aggregations-section">


        <div className="aggregations-card">
          <h3>Agent Productivity</h3>
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
          ) : <p className="empty-message">No data yet.</p>}
        </div>

        
        <div className="aggregations-card">
          <h3>Deadline Analysis</h3>
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
          ) : <p className="empty-message">No data yet.</p>}
        </div>

        
        <div className="aggregations-card">
          <h3>Space Overview</h3>
          {spaceReport ? (
            <pre>{JSON.stringify(spaceReport, null, 2)}</pre>
          ) : <p className="empty-message">No data yet.</p>}
        </div>

      
        <div className="aggregations-card">
          <h3>Checklist Progress</h3>
          {spaces.map(space => (
            <div key={space._id}>
              <strong>{space.space_title || space.spaceTitle}</strong>
              <div className="checklist-buttons">
                {space.checklists?.map(cl => (
                  <button
                    key={cl._id}
                    className="primary-btn"
                    onClick={() => fetchChecklistProgress(cl._id)}
                  >
                    {cl.checklist_title}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {checklistReport && (
            <>
              <h4>Selected Checklist Result</h4>
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
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default AggregationsPage;