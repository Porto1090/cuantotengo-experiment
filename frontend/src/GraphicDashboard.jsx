import React, { useMemo } from "react";
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from "@mui/x-charts/LineChart";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { BoxPlot } from "./BoxPlot.jsx";
import { BoxPlotGroup } from "./BoxPlotGroup.jsx";

export default function GraphicDashboard({ sessions, summary }) {
  // 1️⃣ Agregado por marca (Expected / Qualtrics / Azure)
  const aggregatedByBrand = useMemo(() => {
    return sessions.flatMap(s => s.snapshots.flatMap(snap => snap.rows))
      .reduce((acc, row) => {
        const existing = acc.find(b => b.brand === row.brand);
        if (existing) {
          existing.expected += row.expected;
          existing.qualtrics += row.qualtrics;
          existing.azure += row.azure;
        } else {
          acc.push({ brand: row.brand, expected: row.expected, qualtrics: row.qualtrics, azure: row.azure });
        }
        return acc;
      }, []);
  }, [sessions]);

  // 2️⃣ Tasa de éxito global por marca
  const successByBrand = useMemo(() => {
    return sessions.flatMap(s => s.snapshots.flatMap(snap => snap.rows))
      .reduce((acc, row) => {
        const existing = acc.find(b => b.brand === row.brand);
        if (existing) {
          existing.successes += row.success ? 1 : 0;
          existing.total += 1;
        } else {
          acc.push({ brand: row.brand, successes: row.success ? 1 : 0, total: 1 });
        }
        return acc;
      }, []);
  }, [sessions]);

  // 3️⃣ Timeline de éxito/fallas por snapshot
  const timeline = useMemo(() => {
    return sessions.flatMap(session =>
      session.snapshots.map((snap, idx) => ({
        snapshot: idx + 1, // 1-based
        successRate: snap.rows.filter(r => r.success).length / snap.rows.length,
        failureRate: snap.rows.filter(r => r.userFailure || r.algorithmFailure).length / snap.rows.length
      }))
    );
  }, [sessions]);

  // 4 Todas las filas para scatterplot
  const allRows = useMemo(() => sessions.flatMap(s => s.snapshots.flatMap(snap => snap.rows)), [sessions]);
  //console.log("ALL ROWS", allRows);

  // 5 Calcular datos para BoxPlot
  const boxPlotData = useMemo(() => {
    return ["qualtrics", "azure"].map(key => {
      const values = allRows.map(r => r[key]).filter(v => v != null).sort((a, b) => a - b);
      
      if (values.length === 0) {
        return { label: key, min: 0, q1: 0, median: 0, q3: 0, max: 0, values: [] };
      }
      
      const q1 = values[Math.floor(values.length * 0.25)];
      const q2 = values[Math.floor(values.length * 0.5)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const min = values[0];
      const max = values[values.length - 1];
      
      return { 
        label: key === 'qualtrics' ? 'Qualtrics' : 'Azure',
        min, 
        q1, 
        median: q2, 
        q3, 
        max,
        values: values
      };
    });
  }, [allRows]);

  const boxPlotDataByMetric = useMemo(() => {
    const groupedByBrand = allRows.reduce((acc, row) => {
      if (!acc[row.brand]) {
        acc[row.brand] = [];
      }
      acc[row.brand].push(row);
      return acc;
    }, {});

    const calculateStats = (values) => {
      if (values.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0, values: [] };
      const sorted = [...values].sort((a, b) => a - b);
      return {
        min: sorted[0],
        q1: sorted[Math.floor(sorted.length * 0.25)],
        median: sorted[Math.floor(sorted.length * 0.5)],
        q3: sorted[Math.floor(sorted.length * 0.75)],
        max: sorted[sorted.length - 1],
        values: sorted
      };
    };

    return {
      qualtrics: Object.entries(groupedByBrand).map(([brand, rows]) => ({
        label: brand,
        ...calculateStats(rows.map(r => r.qualtrics).filter(v => v != null))
      })),
      azure: Object.entries(groupedByBrand).map(([brand, rows]) => ({
        label: brand,
        ...calculateStats(rows.map(r => r.azure).filter(v => v != null))
      })),
    };
  }, [allRows]);

  console.log("Box Plot Data by Metric:", boxPlotDataByMetric);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Overall Summary</h2>
        <PieChart
          series={[{
            data: [
              { id: 0, value: summary.session_successes, label: "Session Successes" },
              { id: 1, value: summary.user_failures, label: "User Failures" },
              { id: 2, value: summary.algorithm_failures, label: "Algorithm Failures" },
            ]
          }]}
          width={400}
          height={260}
        />
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Brand Comparison: Expected vs Qualtrics vs Azure</h2>
        <BarChart
          dataset={aggregatedByBrand}
          xAxis={[{ scaleType: "band", dataKey: "brand" }]}
          series={[
            { dataKey: "expected", label: "Expected" },
            { dataKey: "qualtrics", label: "Qualtrics" },
            { dataKey: "azure", label: "Azure" },
          ]}
          height={320}
        />
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Success Rate by Brand</h2>
        <BarChart
          dataset={successByBrand.map(b => ({
            brand: b.brand,
            successRate: b.successes / b.total
          }))}
          xAxis={[{ scaleType: "band", dataKey: "brand" }]}
          series={[{ dataKey: "successRate", label: "Azure Success Rate" }]}
          height={300}
        />
      </section>

      {/* <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Success vs Failure Timeline</h2>
        <LineChart
          dataset={timeline}
          xAxis={[{ dataKey: "snapshot" }]}
          series={[
            { dataKey: "successRate", label: "Success Rate" },
            { dataKey: "failureRate", label: "Failure Rate" },
          ]}
          height={300}
        />
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Azure vs Expected Scatter</h2>
        <ScatterChart
          series={[{
            data: allRows.map(row => ({ x: row.expected, y: row.azure }))
          }]}
          xAxis={[{ label: "Expected" }]}
          yAxis={[{ label: "Azure" }]}
          height={300}
        />
      </section> */}

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Variance</h2>
        <BoxPlot data={boxPlotData} width={600} height={400} />
        **TODO: 
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Variance</h2>
        <BoxPlotGroup data={boxPlotDataByMetric} width={600} height={400} />
        **TODO: 
      </section>
    </div>
  );
}
