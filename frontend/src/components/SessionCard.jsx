import { useState } from "react";
import ComparisonTable from "./ComparisonTable";

export default function SessionCardAzure({ session }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false); // Inicia cerrado por defecto

  const isAzure = session.metadata?.tag === "Treatment" && session.metadata?.phase === "Phase II";

  const snapshots = session.snapshots || [];
  const activeSnapshot = snapshots[activeIndex] || snapshots[0];
  const isSuccess = isAzure 
    ? activeSnapshot?.status === "success" 
    : activeSnapshot?.user_status === "success";

  const getImageUrl = (type) => {
    const sessionId = session.session_id;
    const ts = activeSnapshot?.raw_timestamp?.split('.')[0]; 
    
    if (!ts || !sessionId) return null;

    const fileName = `${sessionId}_${ts}_${type}.jpg`;
    const completeUrl = `https://cuantotengostorage.blob.core.windows.net/experiment/GPT_images/${fileName}`;
    console.log("Generated URL:", completeUrl); // Log para verificar la URL generada
    return completeUrl;
  };

  const hasAlgoFail = isAzure && (activeSnapshot?.totals?.algorithmFailure > 0);

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-200">
      
      {/* HEADER INTERACTIVO */}
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
        
        <div className="flex items-center gap-3 ml-auto">
          {/* Badge de ALGO FAIL */}
          {hasAlgoFail && (
            <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide bg-orange-100 text-orange-700">
              ALGORITHM FAIL
            </span>
          )}

          {/* NUEVO: Badge de Time to Submit mejorado */}
          {session.metadata?.time_to_submit !== undefined && session.metadata?.time_to_submit !== null && (
            <span title="Time to submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide bg-purple-50 text-purple-700 border border-purple-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {session.metadata.time_to_submit}s
            </span>
          )}

          {/* Status Badges */}
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide bg-gray-200 text-gray-700`}>
            {session.metadata?.tag?.toUpperCase()}
          </span>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide bg-gray-200 text-gray-700`}>
            {session.metadata?.phase?.toUpperCase()}
          </span>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {isSuccess ? "SUCCESS" : "FAILURE"}
          </span>
          
          {/* Chevron Animado (Flecha) */}
          <div className={`text-gray-400 transition-transform duration-300 ml-1 ${isOpen ? "rotate-180" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* CONTENIDO DESPLEGABLE */}
      {isOpen && (
        <div className="p-6 animate-fade-in">
          {/* Snapshots Selector (Pills) */}
          {isAzure && (
            snapshots.length > 0 ? (
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
            )
          )}

          {/* Table */}
          <ComparisonTable rows={activeSnapshot?.rows || []} isAzure={isAzure} />
          {isAzure && (
            <div className="mt-6 flex gap-4 justify-end">
            <button
              className="bg-blue-50 border border-gray-300 hover:bg-blue-100 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
              onClick={() => {
                const url = getImageUrl("original");
                if (url) window.open(url, "_blank");
                else alert("No se pudo generar la URL");
              }}
            >
              📸 Download Original Image
            </button>
            <button
              className="bg-blue-50 border border-gray-300 hover:bg-blue-100 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
              onClick={() => {
                const url = getImageUrl("bounding_boxes");
                if (url) window.open(url, "_blank");
                else alert("No se pudo generar la URL");
              }}
            >
              📸 Download Bounding Boxes Image
            </button>
          </div>
          )}
        </div>
      )}
    </div>
  );
}