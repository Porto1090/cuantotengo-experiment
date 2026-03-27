import React, { useMemo } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { BoxPlot } from "./BoxPlot.jsx";
import { BoxPlotGroup } from "./BoxPlotGroup.jsx";
import { formatBrandName } from "../utils/formatters"; // Asegúrate de tener esta utilidad

export default function GraphicDashboard({ sessions }) {
  // 1️⃣ Extraer solo el snapshot más reciente de cada sesión para un análisis real
  // (Si contamos todos los snapshots históricos, duplicaríamos datos de la misma sesión)
  const activeRows = useMemo(() => {
    return sessions
      .map(s => s.snapshots[0]) // Tomamos el más reciente
      .filter(Boolean)
      .flatMap(snap => snap.rows);
  }, [sessions]);

  // 2️⃣ Agregaciones por Marca
  const brandStats = useMemo(() => {
    const stats = activeRows.reduce((acc, row) => {
      const brand = formatBrandName(row.brand);
      if (!acc[brand]) {
        acc[brand] = {
          brand,
          expected: 0,
          qualtrics: 0,
          azure: 0,
          successes: 0,
          userFailures: 0,
          algorithmFailures: 0,
          diffAzureSum: 0,
          count: 0
        };
      }
      
      acc[brand].expected += row.expected;
      acc[brand].qualtrics += row.qualtrics;
      acc[brand].azure += row.azure;
      acc[brand].successes += row.success ? 1 : 0;
      acc[brand].userFailures += row.userFailure ? 1 : 0;
      acc[brand].algorithmFailures += row.algorithmFailure ? 1 : 0;
      acc[brand].diffAzureSum += (row.azure - row.expected);
      acc[brand].count += 1;
      
      return acc;
    }, {});

    return Object.values(stats).sort((a, b) => b.expected - a.expected); // Ordenar por volumen esperado
  }, [activeRows]);

  // 3️⃣ Datos para BoxPlots
  const boxPlotData = useMemo(() => {
    return ["qualtrics", "azure"].map(key => {
      const values = activeRows.map(r => r[key]).filter(v => v != null).sort((a, b) => a - b);
      if (values.length === 0) return { label: key, min: 0, q1: 0, median: 0, q3: 0, max: 0, values: [] };
      
      return { 
        label: key === 'qualtrics' ? 'Qualtrics (User Input)' : 'Azure (Algorithm)',
        min: values[0], 
        q1: values[Math.floor(values.length * 0.25)], 
        median: values[Math.floor(values.length * 0.5)], 
        q3: values[Math.floor(values.length * 0.75)], 
        max: values[values.length - 1],
        values
      };
    });
  }, [activeRows]);

  const boxPlotDataByMetric = useMemo(() => {
    const grouped = activeRows.reduce((acc, row) => {
      const brand = formatBrandName(row.brand);
      if (!acc[brand]) acc[brand] = [];
      acc[brand].push(row);
      return acc;
    }, {});

    const calc = (vals) => {
      if (vals.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0, values: [] };
      const s = [...vals].sort((a, b) => a - b);
      return { min: s[0], q1: s[Math.floor(s.length * 0.25)], median: s[Math.floor(s.length * 0.5)], q3: s[Math.floor(s.length * 0.75)], max: s[s.length - 1], values: s };
    };

    return {
      qualtrics: Object.entries(grouped).map(([brand, rows]) => ({ label: brand, ...calc(rows.map(r => r.qualtrics)) })),
      azure: Object.entries(grouped).map(([brand, rows]) => ({ label: brand, ...calc(rows.map(r => r.azure)) })),
    };
  }, [activeRows]);

  // Si no hay datos, mostrar un estado vacío bonito
  if (!activeRows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500 text-lg">No data available to generate charts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICA 1: Comparación de Volumen */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">Total Volume Detection</h2>
            <p className="text-sm text-gray-500">Comparing Ground Truth (Expected) vs User Input vs Algorithm.</p>
          </div>
          <BarChart
            dataset={brandStats}
            xAxis={[{ scaleType: "band", dataKey: "brand", tickLabelStyle: { fontSize: 11, angle: -25, textAnchor: 'end' } }]}
            series={[
              { dataKey: "expected", label: "Ground Truth", color: "#94a3b8" },
              { dataKey: "qualtrics", label: "Qualtrics (User)", color: "#60a5fa" },
              { dataKey: "azure", label: "Azure (Alg)", color: "#818cf8" },
            ]}
            height={350}
            margin={{ bottom: 80 }} // Espacio para las etiquetas inclinadas
            slotProps={{ legend: { direction: 'row', position: { vertical: 'top', horizontal: 'middle' } } }}
          />
        </section>

        {/* GRÁFICA 2: Stacked Bar de Tipos de Error */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">Effectiveness & Failure Source</h2>
            <p className="text-sm text-gray-500">Breakdown of successes vs specific failure reasons per brand.</p>
          </div>
          <BarChart
            dataset={brandStats}
            xAxis={[{ scaleType: "band", dataKey: "brand", tickLabelStyle: { fontSize: 11, angle: -25, textAnchor: 'end' } }]}
            series={[
              { dataKey: "successes", label: "Success", color: "#34d399", stack: "total" },
              { dataKey: "userFailures", label: "User Error", color: "#fbbf24", stack: "total" },
              { dataKey: "algorithmFailures", label: "Alg Error", color: "#f87171", stack: "total" },
            ]}
            height={350}
            margin={{ bottom: 80 }}
            slotProps={{ legend: { direction: 'row', position: { vertical: 'top', horizontal: 'middle' } } }}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICA 3: Diferencia Promedio (Accuracy Delta) */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">Algorithm Accuracy Delta</h2>
            <p className="text-sm text-gray-500">Average difference (Azure - Expected). Negative means undercounting, positive overcounting.</p>
          </div>
          <BarChart
            dataset={brandStats.map(b => ({
              brand: b.brand,
              avgDelta: Number((b.diffAzureSum / b.count).toFixed(2))
            }))}
            xAxis={[{ scaleType: "band", dataKey: "brand", tickLabelStyle: { fontSize: 11, angle: -25, textAnchor: 'end' } }]}
            series={[
              { 
                dataKey: "avgDelta", 
                label: "Avg Delta per Session", 
                // Color dinámico simulado: MUI no permite colores por barra fácilmente, usamos un solo color neutral que muestre +/-
                color: "#6366f1" 
              }
            ]}
            height={350}
            margin={{ bottom: 80 }}
          />
        </section>

        {/* GRÁFICA 4: BoxPlot General */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
          <div className="mb-4 w-full">
            <h2 className="text-lg font-bold text-gray-800">Global Data Variance</h2>
            <p className="text-sm text-gray-500">Distribution of input counts across all brands.</p>
          </div>
          <div className="overflow-x-auto w-full flex justify-center">
            <BoxPlot data={boxPlotData} width={500} height={350} showPoints={true} />
          </div>
        </section>
      </div>

      {/* GRÁFICA 5: BoxPlot por Marca (Ocupa todo el ancho por ser muy detallada) */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">Variance Analysis by Brand</h2>
          <p className="text-sm text-gray-500">Detailed IQR and median comparison for each brand.</p>
        </div>
        <div className="overflow-x-auto w-full">
          {/* Le damos un ancho dinámico basado en la cantidad de marcas para que no se apriete */}
          <BoxPlotGroup data={boxPlotDataByMetric} width={Math.max(1000, brandStats.length * 100)} height={400} />
        </div>
      </section>

    </div>
  );
}