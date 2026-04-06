import { useEffect, useState } from "react";
import SummaryCards from "./components/SummaryCards";
import SessionCard from "./components/SessionCard";
import LoadingData from "./components/LoadingData";
import GraphicDashboard from "./graphics/GraphicDashboard";

function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'graphics' | 'groundtruth'
  
  const [activeTab, setActiveTab] = useState("all");
  const [dashboardData, setDashboardData] = useState(null);

  const tabs = [
    { id: "all", label: "ALL" },
    { id: "control_phase_1", label: "Control - Phase I" },
    { id: "control_phase_2", label: "Control - Phase II" },
    { id: "treatment_phase_1", label: "Treatment - Phase I" },
    { id: "treatment_phase_2", label: "Treatment - Phase II" },
  ];

  const groundtruths = [
    {
      title: "Control - Phase I",
      data: { 
        "boing_mango": 3, 
        "boing_manzana": 4, 
        "jumex_durazno": 4,
        "jumex_manzana": 3, 
        "pepsi_original": 5, 
        "squirt_original": 5, 
      }
    },
    {
      title: "Control - Phase II",
      data: { 
        "boing_fresa": 3,
        "jumex_manzana": 3,
        "manzanita_sol_original": 3, 
        "mirinda_original": 4,
        "pepsi_original": 11,
      }
    },
    {
      title: "Treatment - Phase I",
      data: { 
        "7_up_original": 3,
        "boing_fresa": 3, 
        "boing_guayaba": 6, 
        "boing_mango": 3, 
        "pepsi_original": 5, 
        "squirt_original": 4, 
      }
    },
    {
      title: "Treatment - Phase II",
      data: { 
        "7_up_original": 4,
        "jumex_mango": 4, 
        "jumex_durazno": 2, 
        "manzanita_sol_original": 5, 
        "mirinda_original": 3, 
        "pepsi_original": 6, 
      }
    }
  ];

  const currentGroup = dashboardData?.[activeTab] || { sessions: [], summary: {} };
  const { sessions, summary } = currentGroup;

  // Función para obtener los datos desde el JSON estático
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Asegúrate de que el archivo dashboardData.json esté en la carpeta "public"
      // Agregamos un timestamp opcional para evitar que el navegador guarde el JSON en caché si lo sobreescribes
      const response = await fetch(`/dashboard_data.json`);
      
      if (!response.ok) throw new Error(`Error cargando el JSON: ${response.status}`);

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error al cargar la data estática:", error);
    } finally {
      setLoading(false);
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
            <p className="text-gray-500 mt-1">Cuanto Tengo Experiment Analysis.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setView("dashboard")}
              className={`border font-semibold py-2 px-4 rounded-lg shadow-sm transition-all ${view === "dashboard" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              📋 View Complete Details
            </button>
            
            <button 
              onClick={() => setView("graphics")} 
              className={`border font-semibold py-2 px-4 rounded-lg shadow-sm transition-all ${view === "graphics" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              📈 Azure Graphics (Treatment Phase II)
            </button>

            <button
              onClick={() => setView("groundtruth")}
              className={`border font-semibold py-2 px-4 rounded-lg shadow-sm transition-all ${view === "groundtruth" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              ⛰️ Ground Truth
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        {loading ? (
          <LoadingData />
        ) : view === "groundtruth" ? (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Expected Values per Phase</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groundtruths.map((phase, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-indigo-700">{phase.title}</h3>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {Object.entries(phase.data).map(([brand, amount]) => (
                        <li key={brand} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                          <span className="text-gray-600 font-medium">{brand.replace(/_/g, ' ').toUpperCase()}</span>
                          <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full text-sm">
                            {amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === "graphics" ? (
          <GraphicDashboard sessions={dashboardData?.["treatment_phase_2"]?.sessions} summary={dashboardData?.["treatment_phase_2"]?.summary} />
        ) : (
          <div className="space-y-8 animate-fade-in">            
            {/* TABS (Vista de Dashboard normal) */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const tabTotal = dashboardData?.[tab.id]?.summary?.total_records || 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                      isActive
                        ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
                      {tabTotal}
                    </span>
                  </button>
                );
              })}
            </div>

            <SummaryCards summary={summary} />
            
            <div className="space-y-6">
              {sessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No sessions available for this group.</p>
                </div>
              ) : (
                sessions.map((session, index) => (
                  <SessionCard 
                    key={`${session.session_id}-${index}`} 
                    session={session} 
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;