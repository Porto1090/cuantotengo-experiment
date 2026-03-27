import { useEffect, useState } from "react";
import SummaryCards from "./components/SummaryCards";
import SessionCard from "./components/SessionCard";
import LoadingData from "./components/LoadingData";
import GraphicDashboard from "./graphics/GraphicDashboard";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'graphics'

  // Función para obtener los datos (con cache-busting)
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Agregamos un timestamp (?t=...) para evitar que el navegador guarde la respuesta en caché
      const response = await fetch(`${API_BASE}/api/dashboard?t=${new Date().getTime()}`);
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setSessions(data.sessions || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // NUEVA: Función para el botón que fuerza la actualización en el backend
  const handleForceRefresh = async () => {
    try {
      setLoading(true);
      // 1. Le decimos al backend que extraiga datos frescos de Azure/Qualtrics
      const refreshResponse = await fetch(`${API_BASE}/api/dashboard/refresh`, { 
        method: "POST" 
      });
      
      if (!refreshResponse.ok) throw new Error("Error forzando actualización");
      
      // 2. Una vez que el backend terminó, volvemos a descargar el JSON actualizado
      await fetchDashboardData();
    } catch (error) {
      console.error("Refresh Error:", error);
      setLoading(false); // Apagamos el loading en caso de error
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Actions */}
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Qualtrics Audit Dashboard</h1>
            <p className="text-gray-500 mt-1">Intercepting and validating Azure logs vs Ground Truth.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setView(view === "dashboard" ? "graphics" : "dashboard")} 
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
            >
              {view === "dashboard" ? "📈 View Graphics" : "📋 View Details"}
            </button>
            <button 
              onClick={handleForceRefresh} 
              disabled={loading}
              className={`font-semibold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2 
                ${loading ? "bg-indigo-400 cursor-not-allowed text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        {loading ? (
          <LoadingData />
        ) : view === "dashboard" ? (
          <>
            <SummaryCards summary={summary} />
            <div className="space-y-6">
              {sessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No sessions available.</p>
                </div>
              ) : (
                sessions.map(session => (
                  <SessionCard key={session.session_id} session={session} />
                ))
              )}
            </div>
          </>
        ) : (
          <GraphicDashboard sessions={sessions} summary={summary} />
        )}

      </div>
    </div>
  );
}

export default App;