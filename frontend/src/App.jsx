import { useEffect, useState } from "react";
import ComparisonTable from "./ComparisonTable.jsx";
import LoadingData from "./LoadingData.jsx";
import GraphicDashboard from "./GraphicDashboard.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState({});
  const [dashboardData, setDashboardData] = useState("dashboard");

  const callApi = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/dashboard`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const { sessions, summary } = data;
      setSessions(sessions || []);
      setSummary(summary || {});
    } catch (error) {
      console.error("API Error:", error);
      alert("Error loading dashboard data. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    callApi();
  }, []);

  const toggleDashboardData = () => {
    setDashboardData(prev => prev === "dashboard" ? "graphics" : "dashboard");
  }

  return (
    <div className="p-10">
      <div className="mb-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Qualtrics Dashboard</h1>
        <button onClick={callApi} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center gap-4">
          <span>Refresh Data</span>
        </button>
      </div>
      <button onClick={toggleDashboardData} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center gap-4 mb-4">
        <span>Toggle Dashboard Data</span>
      </button>
      
      {dashboardData === "dashboard" && (
        loading ? (
          <LoadingData />
        ) : (
          <>
            <div className="mb-6 rounded-xl bg-gray-200 p-2 shadow-md">
              <div className="rounded-base">
                <div className="grid grid-cols-4 gap-8 p-4 mx-auto">
                  <div className="flex flex-col bg-gray-400 rounded-lg p-6">
                    <p className="mb-2 text-2xl font-semibold">{summary.total_records}</p>
                    <p className="text-lg text-white font-extrabold">Total Records:</p>
                  </div>
                  <div className="flex flex-col bg-gray-400 rounded-lg p-6">
                    <p className="mb-2 text-2xl font-semibold">{summary.session_successes}</p>
                    <p className="text-lg text-white font-extrabold">Session Successes:</p>
                  </div>
                  <div className="flex flex-col bg-gray-400 rounded-lg p-6">
                    <p className="mb-2 text-2xl font-semibold">{summary.user_failures}</p>
                    <p className="text-lg text-white font-extrabold">Individual User Failures:</p>
                  </div>
                  <div className="flex flex-col bg-gray-400 rounded-lg p-6">
                    <p className="mb-2 text-2xl font-semibold">{summary.algorithm_failures}</p>
                    <p className="text-lg text-white font-extrabold">Individual Algorithm Failures:</p>
                  </div>
                </div>
                <h1 className="text-sm text-gray-800 m-4 mt-0">Disclaimer: These data consider the last or only photo taken by the user ID</h1>
              </div>
            </div>
      
            {sessions.map(session => {
              const activeIndex = selectedRowIndex[session.session_id] ?? 0;
              return (
                <div
                key={session.session_id}
                className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex justify-between items-center border-b pb-4">
                    <div>
                      <h3 className="mb-4 text-xl font-semibold text-gray-800">Session ID: {session.session_id}</h3>
                      <p>Qualtrics Timestamp: {session.metadata["start_date"]}</p>
                    </div>
                    <div className="p-2 border bg-red-100">
                      <p className={`font-bold text-2xl ${session.snapshots[activeIndex]?.status === "success" ? "text-green-600" : "text-red-600"}`}>{session.snapshots[activeIndex]?.status === "success" ? "SUCCESS" : "ERROR"}</p>
                    </div>
                  </div>
                  {session.snapshots?.map((snapshot, index) => {
                    const isActive = selectedRowIndex[session.session_id] === index || (selectedRowIndex[session.session_id] === undefined && index === 0);
                    return (
                    <button key={index}
                      className={`bg-gray-100 ml-4 p-2 rounded-b rounded-2xl border-gray-200
                        ${isActive
                          ? "bg-gray-400 text-white border-gray-800"
                          : "bg-gray-100 hover:bg-gray-200 border-gray-200"
                        }`}
                      onClick={() =>
                        setSelectedRowIndex(prev => ({
                          ...prev,
                          [session.session_id]: index
                        }))
                    }>
                      {snapshot.timestamp}
                    </button>
                  )})}
                  {session.snapshots.length === 0 ? <p className="ml-4 my-4 text-sm text-gray-500">No Azure logs found for this session.</p> : null}
                  <ComparisonTable rows={session.snapshots[activeIndex]?.rows || []}/>
                </div>
              )
            })}
          </>
        )
      )}
      {dashboardData === "graphics" && (
        loading ? (
          <LoadingData />
        ) : (
          <GraphicDashboard sessions={sessions} summary={summary}/>
        )
      )}
    </div>
  );
}

export default App;
