export default function ComparisonTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full border-collapse bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Brand</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Expected</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Qualtrics</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Azure</th>
            <th className="py-3 text-center font-semibold text-gray-700">User Failed</th>
            <th className="py-3 text-center font-semibold text-gray-700">Algorithm Failed</th>
            <th className="py-3 text-center font-semibold text-gray-700">Success</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
              <tr 
                key={row.brand}
                className={`border-t ${row.success ? index % 2 === 0 ? "bg-white" : "bg-gray-50" : row.userFailure || row.algorithmFailure ? "bg-red-200" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  {row.brand}
                </td>
                <td className="px-4 py-3 text-right">{row.expected}</td>
                <td className="px-4 py-3 text-right">{row.qualtrics}</td>
                <td className="px-4 py-3 text-right">{row.azure}</td>
                <td className="text-center">
                  {row.userFailure ? 'YES' : 'NO'} 
                </td>
                <td className="text-center">
                  {row.algorithmFailure ? 'YES' : 'NO'} 
                </td>
                <td className="text-center">
                  {row.success ? 'YES' : 'NO'}
                </td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          {(() => {
            const total_exp = rows.reduce((sum, row) => sum + row.expected, 0);
            const total_qual = rows.reduce((sum, row) => sum + row.qualtrics, 0);
            const total_az = rows.reduce((sum, row) => sum + row.azure, 0);
            return (
              <tr className="bg-gray-200 border-t font-semibold text-gray-700">
                <td className="px-4 py-3 font-bold text-gray-800">Total</td>
                <td className="px-4 py-3 text-right font-bold">{total_exp}</td>
                <td className={`px-4 py-3 text-right font-bold ${total_exp !== total_qual ? "text-green-600" : "text-gray-700"}`}>{total_qual}</td>
                <td className={`px-4 py-3 text-right font-bold ${total_exp !== total_az ? "text-green-600" : "text-gray-700"}`}>{total_az}</td>
                <td />
                <td />
                <td />
              </tr>
            );
          })()}
        </tfoot>
      </table>  
    </div>
  );
}
