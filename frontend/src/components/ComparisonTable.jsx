import { formatBrandName } from "../utils/formatters";

export default function ComparisonTable({ rows }) {
  if (!rows || rows.length === 0) return <p className="text-gray-500 italic py-4">No data available for this snapshot.</p>;

  const totalExpected = rows.reduce((sum, row) => sum + row.expected, 0);
  const totalQualtrics = rows.reduce((sum, row) => sum + row.qualtrics, 0);
  const totalAzure = rows.reduce((sum, row) => sum + row.azure, 0);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      {/* Agregamos table-fixed para forzar la distribución estricta de columnas */}
      <table className="min-w-full table-fixed border-collapse bg-white text-sm">
        <thead className="bg-gray-50">
          <tr>
            {/* Aplicamos w-[14.28%] (1/7 del ancho total) a TODAS las columnas */}
            <th className="w-[14.28%] px-4 py-3 text-left font-semibold text-gray-600">Brand</th>
            <th className="w-[14.28%] px-4 py-3 text-right font-semibold text-gray-600">Expected</th>
            <th className="w-[14.28%] px-4 py-3 text-right font-semibold text-gray-600">Qualtrics</th>
            <th className="w-[14.28%] px-4 py-3 text-right font-semibold text-gray-600">Azure</th>
            <th className="w-[14.28%] px-4 py-3 text-center font-semibold text-gray-600">User Failed</th>
            <th className="w-[14.28%] px-4 py-3 text-center font-semibold text-gray-600">Algorithm Failed</th>
            <th className="w-[14.28%] px-4 py-3 text-center font-semibold text-gray-600">Success</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => {
            const hasError = row.userFailure || row.algorithmFailure;
            return (
              <tr key={row.brand} className={`transition-colors hover:bg-gray-50 ${hasError ? "bg-red-50/50" : ""}`}>
                {/* Agregamos truncate por si algún nombre de marca es más largo que la columna */}
                <td className="px-4 py-3 font-medium text-gray-800 truncate" title={formatBrandName(row.brand)}>
                  {formatBrandName(row.brand)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{row.expected}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.qualtrics}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.azure}</td>
                <td className="px-4 py-3 text-center">{row.userFailure ? "⚠️" : "-"}</td>
                <td className="px-4 py-3 text-center">{row.algorithmFailure ? "⚠️" : "-"}</td>
                <td className="px-4 py-3 text-center">{row.success ? "✅" : "❌"}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold text-gray-800">
          <tr>
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3 text-right">{totalExpected}</td>
            <td className={`px-4 py-3 text-right ${totalExpected !== totalQualtrics ? "text-red-600" : ""}`}>{totalQualtrics}</td>
            <td className={`px-4 py-3 text-right ${totalExpected !== totalAzure ? "text-red-600" : ""}`}>{totalAzure}</td>
            {/* Como colSpan="3" equivale a 3 columnas, ocupará el 42.84% restante de manera exacta */}
            <td colSpan="3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}