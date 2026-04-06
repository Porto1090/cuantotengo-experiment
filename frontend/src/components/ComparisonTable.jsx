import { formatBrandName } from "../utils/formatters";

export default function ComparisonTable({ rows, isAzure = false }) {
  if (!rows || rows.length === 0) return <p className="text-gray-500 italic py-4">No data available for this snapshot.</p>;

  // 1. Cálculos de totales condicionales
  const totalExpected = rows.reduce((sum, row) => sum + (row.expected || 0), 0);
  const totalQualtrics = rows.reduce((sum, row) => sum + (row.qualtrics || 0), 0);
  const totalAzure = isAzure ? rows.reduce((sum, row) => sum + (row.azure || 0), 0) : 0;

  // 2. Ajuste dinámico del ancho de las columnas (4 columnas vs 7 columnas)
  const colWidth = isAzure ? "w-[14.28%]" : "w-1/4";

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full table-fixed border-collapse bg-white text-sm">
        
        {/* ENCABEZADOS */}
        <thead className="bg-gray-50">
          <tr>
            <th className={`${colWidth} px-4 py-3 text-left font-semibold text-gray-600`}>Brand</th>
            <th className={`${colWidth} px-4 py-3 text-right font-semibold text-gray-600`}>Expected</th>
            <th className={`${colWidth} px-4 py-3 text-right font-semibold text-gray-600`}>Qualtrics</th>
            
            {/* Columnas exclusivas de Azure */}
            {isAzure && (
              <>
                <th className={`${colWidth} px-4 py-3 text-right font-semibold text-gray-600`}>Azure</th>
                <th className={`${colWidth} px-4 py-3 text-center font-semibold text-gray-600`}>User Failed</th>
                <th className={`${colWidth} px-4 py-3 text-center font-semibold text-gray-600`}>Algorithm Failed</th>
              </>
            )}
            
            <th className={`${colWidth} px-4 py-3 text-center font-semibold text-gray-600`}>Success</th>
          </tr>
        </thead>

        {/* CUERPO DE LA TABLA */}
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => {
            const hasError = row.userFailure || row.algorithmFailure;
            
            return (
              <tr key={row.brand} className={`transition-colors hover:bg-gray-50 ${hasError ? "bg-red-50/50" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-800 truncate" title={formatBrandName(row.brand)}>
                  {formatBrandName(row.brand)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{row.expected}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.qualtrics}</td>
                
                {/* Celdas exclusivas de Azure */}
                {isAzure && (
                  <>
                    <td className="px-4 py-3 text-right text-gray-600">{row.azure}</td>
                    <td className="px-4 py-3 text-center">{row.userFailure ? "⚠️" : "-"}</td>
                    <td className="px-4 py-3 text-center">{row.algorithmFailure ? "⚠️" : "-"}</td>
                  </>
                )}

                {/* La lógica de éxito cambia ligeramente según el modo */}
                <td className="px-4 py-3 text-center">
                  {isAzure 
                    ? (row.success ? "✅" : "❌") 
                    : (!row.userFailure ? "✅" : "❌")
                  }
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* PIE DE TABLA (TOTALES) */}
        <tfoot className="bg-gray-100 font-semibold text-gray-800">
          <tr>
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3 text-right">{totalExpected}</td>
            <td className={`px-4 py-3 text-right ${totalExpected !== totalQualtrics ? "text-red-600" : ""}`}>
              {totalQualtrics}
            </td>
            
            {/* Totales y celdas vacías dinámicas para Azure */}
            {isAzure && (
              <td className={`px-4 py-3 text-right ${totalExpected !== totalAzure ? "text-red-600" : ""}`}>
                {totalAzure}
              </td>
            )}
            
            {/* Si es Azure ocupa 3 espacios (User, Algorithm, Success), si es normal ocupa 1 (Success) */}
            <td colSpan={isAzure ? 3 : 1} />
          </tr>
        </tfoot>

      </table>
    </div>
  );
}