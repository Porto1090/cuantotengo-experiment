import React, { useState } from "react";

// VerticalBox puede vivir aquí y ser exportado para que BoxPlotGroup lo use
export const VerticalBox = ({ min, q1, median, q3, max, width, stroke, fill, outliers = [] }) => {
  const STROKE_WIDTH = 2;
  // Validación de seguridad para que SVG no falle si recibe NaN
  if (isNaN(min) || isNaN(max)) return null;

  return (
    <g>
      <line x1={width / 2} x2={width / 2} y1={min} y2={q1} stroke={stroke} strokeWidth={STROKE_WIDTH} strokeDasharray="3,3" />
      <line x1={width / 2} x2={width / 2} y1={q3} y2={max} stroke={stroke} strokeWidth={STROKE_WIDTH} strokeDasharray="3,3" />
      <line x1={width * 0.25} x2={width * 0.75} y1={min} y2={min} stroke={stroke} strokeWidth={STROKE_WIDTH} />
      <line x1={width * 0.25} x2={width * 0.75} y1={max} y2={max} stroke={stroke} strokeWidth={STROKE_WIDTH} />
      <rect x={0} y={q3} width={width} height={Math.max(0, q1 - q3)} stroke={stroke} fill={fill} strokeWidth={STROKE_WIDTH} opacity={0.7} />
      <line x1={0} x2={width} y1={median} y2={median} stroke={stroke} strokeWidth={STROKE_WIDTH + 1} />
      {outliers.map((outlier, idx) => (
        <circle key={idx} cx={width / 2} cy={outlier} r={3} fill="#ef4444" stroke="#dc2626" strokeWidth={1} />
      ))}
    </g>
  );
};

export const BoxPlot = ({ data, width = 600, height = 400, boxWidth = 50, showPoints = false, showGrid = true }) => {
  const [hoveredBox, setHoveredBox] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  const margin = { top: 20, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Calcular escala de manera segura
  const allVals = data.flatMap(d => d.values || [d.min, d.max]).filter(v => v != null && !isNaN(v));
  const globalMin = allVals.length ? Math.min(...allVals) : 0;
  const globalMax = allVals.length ? Math.max(...allVals) : 10; // Fallback si no hay datos
  
  let range = globalMax - globalMin;
  if (range === 0) range = 10; // Evitar división por cero
  
  const padding = range * 0.2;
  const scale = (value) => {
    if (value == null || isNaN(value)) return chartHeight;
    return chartHeight - ((value - (globalMin - padding)) / (range + 2 * padding)) * chartHeight;
  };
  
  // Generar cuadrícula
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const value = (globalMin - padding) + (range + 2 * padding) * (i / numGridLines);
    gridLines.push({ y: scale(value), value: Math.max(0, value).toFixed(1) });
  }
  
  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {showGrid && gridLines.map((line, i) => (
          <g key={`grid-${i}`}>
            <line x1={0} x2={chartWidth} y1={line.y} y2={line.y} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="2,2" />
            <text x={-10} y={line.y + 4} textAnchor="end" fontSize={11} fill="#6b7280">{line.value}</text>
          </g>
        ))}
        
        <line x1={0} x2={0} y1={0} y2={chartHeight} stroke="#374151" strokeWidth={2} />
        
        {data.map((d, i) => {
          const x = i * (chartWidth / data.length) + (chartWidth / data.length - boxWidth) / 2;
          const centerX = x + boxWidth / 2;
          
          const iqr = d.q3 - d.q1;
          const lowerFence = d.q1 - 1.5 * iqr;
          const upperFence = d.q3 + 1.5 * iqr;
          const outliers = (d.values || []).filter(v => v < lowerFence || v > upperFence).map(scale);
          
          return (
            <g key={`box-${i}`}>
              {showPoints && d.values && d.values.map((value, idx) => {
                if (value < lowerFence || value > upperFence) return null;
                const jitter = (Math.random() - 0.5) * (boxWidth * 0.6);
                return (
                  <circle
                    key={`pt-${idx}`}
                    cx={centerX + jitter}
                    cy={scale(value)}
                    r={hoveredPoint === `${i}-${idx}` ? 5 : 3}
                    fill={hoveredBox === i ? "#6366f1" : "#94a3b8"}
                    opacity={hoveredBox === i ? 0.8 : 0.4}
                    stroke={hoveredPoint === `${i}-${idx}` ? "#4f46e5" : "none"}
                    strokeWidth={2}
                    onMouseEnter={() => { setHoveredBox(i); setHoveredPoint(`${i}-${idx}`); }}
                    onMouseLeave={() => { setHoveredBox(null); setHoveredPoint(null); }}
                  />
                );
              })}
              
              <g transform={`translate(${x},0)`} onMouseEnter={() => setHoveredBox(i)} onMouseLeave={() => setHoveredBox(null)}>
                <VerticalBox
                  min={scale(d.min)} q1={scale(d.q1)} median={scale(d.median)} q3={scale(d.q3)} max={scale(d.max)}
                  width={boxWidth}
                  stroke={hoveredBox === i ? "#4f46e5" : "#334155"}
                  fill={hoveredBox === i ? "#818cf8" : "#a5b4fc"}
                  outliers={outliers}
                />
                
                <text x={boxWidth / 2} y={chartHeight + 20} textAnchor="middle" fontSize={12} fontWeight={hoveredBox === i ? "600" : "400"} fill="#1f2937">
                  {d.label}
                </text>
                
                {hoveredBox === i && (
                  <g>
                    <rect x={boxWidth + 10} y={scale(d.q3) - 70} width={120} height={95} fill="white" stroke="#d1d5db" rx={4} filter="url(#shadow)" />
                    <text x={boxWidth + 20} y={scale(d.q3) - 52} fontSize={11} fontWeight="600">{d.label}</text>
                    <text x={boxWidth + 20} y={scale(d.q3) - 37} fontSize={10} fill="#6b7280">Max: {d.max?.toFixed(1)}</text>
                    <text x={boxWidth + 20} y={scale(d.q3) - 25} fontSize={10} fill="#6b7280">Q3: {d.q3?.toFixed(1)}</text>
                    <text x={boxWidth + 20} y={scale(d.q3) - 13} fontSize={10} fill="#4f46e5" fontWeight="600">Med: {d.median?.toFixed(1)}</text>
                    <text x={boxWidth + 20} y={scale(d.q3) - 1} fontSize={10} fill="#6b7280">Q1: {d.q1?.toFixed(1)}</text>
                    <text x={boxWidth + 20} y={scale(d.q3) + 11} fontSize={10} fill="#6b7280">Min: {d.min?.toFixed(1)}</text>
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </g>
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>
    </svg>
  );
};