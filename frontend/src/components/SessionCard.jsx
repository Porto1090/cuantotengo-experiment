import { useState } from "react";
import ComparisonTable from "./ComparisonTable";

export default function SessionCard({ session }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false); // Inicia cerrado por defecto

  const snapshots = session.snapshots || [];
  const activeSnapshot = snapshots[activeIndex];
  const isSuccess = activeSnapshot?.status === "success";

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-200">
      
      {/* HEADER INTERACTIVO */}
      {/* Al hacer clic en cualquier parte de esta barra, se abrirá o cerrará */}
      <div 
        className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Session ID: <span className="text-indigo-600">{session.session_id}</span>
          </h3>
          <p className="text-sm text-gray-500">Started: {session.metadata?.start_date} (UTC-6)</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {isSuccess ? "SUCCESS" : "ERROR"}
          </span>
          
          {/* Chevron Animado (Flecha) */}
          <div className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* CONTENIDO DESPLEGABLE */}
      {/* Envolvemos todo el contenido, no solo la tabla, para ocultar también los botones si está cerrado */}
      {isOpen && (
        <div className="p-6 animate-fade-in">
          {/* Snapshots Selector (Pills) */}
          {snapshots.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-6">
              {snapshots.map((snapshot, index) => {
                const isActive = activeIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-md" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    ⏱ {snapshot.timestamp !== "0000-00-00 00:00:00" ? snapshot.timestamp : "Fallback (No Azure)"}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mb-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              No Azure logs found for this session.
            </p>
          )}

          {/* Table */}
          <ComparisonTable rows={activeSnapshot?.rows || []} />
        </div>
      )}
    </div>
  );
}