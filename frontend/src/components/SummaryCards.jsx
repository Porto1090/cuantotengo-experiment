export default function SummaryCards({ summary }) {
  const cards = [
    { title: "Total Records", value: summary.total_records, color: "text-blue-600" },
    { title: "Session Successes", value: summary.session_successes, color: "text-green-600" },
    { title: "Individual User Failures", value: summary.user_failures, color: "text-red-500" },
    { title: "Algorithm Failures", value: summary.algorithm_failures, color: "text-orange-500" },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.title}</p>
            <p className={`text-4xl font-extrabold mt-2 ${card.color}`}>{card.value ?? 0}</p>
          </div>
        ))}
      </div>
      {/* Nueva Tarjeta Full-Width para el Promedio de Tiempo */}
      {/* Solo se muestra si el valor existe (no se mostrará en el tab "all") */}
      {summary.average_time_to_submit !== undefined && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100 w-full flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Average Completition Time
            </p>
            <p className="text-3xl font-extrabold mt-2 text-purple-600">
              {summary.average_time_to_submit} <span className="text-lg font-medium text-gray-400 lowercase">seconds</span>
            </p>
          </div>     
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-sm text-gray-400">
              Average completion time<br/>for this specific group
            </p>
          </div>     
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Disclaimer: These data consider the information obtained from each user ID.
      </p>
    </div>
  );
}