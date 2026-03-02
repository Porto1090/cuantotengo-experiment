import React, { useState } from "react";

export const VerticalBox = ({ min, q1, median, q3, max, width, stroke, fill, outliers = [] }) => {
  const STROKE_WIDTH = 2;
  return (
    <g>
      {/* Línea inferior del bigote (min a Q1) */}
      <line
        x1={width / 2}
        x2={width / 2}
        y1={min}
        y2={q1}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray="3,3"
      />
      
      {/* Línea superior del bigote (Q3 a max) */}
      <line
        x1={width / 2}
        x2={width / 2}
        y1={q3}
        y2={max}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray="3,3"
      />
      
      {/* Tapa inferior del bigote */}
      <line
        x1={width * 0.25}
        x2={width * 0.75}
        y1={min}
        y2={min}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
      />
      
      {/* Tapa superior del bigote */}
      <line
        x1={width * 0.25}
        x2={width * 0.75}
        y1={max}
        y2={max}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
      />
      
      {/* Caja (Q1 a Q3) */}
      <rect
        x={0}
        y={q3}
        width={width}
        height={q1 - q3}
        stroke={stroke}
        fill={fill}
        strokeWidth={STROKE_WIDTH}
        opacity={0.7}
      />
      
      {/* Línea de la mediana */}
      <line
        x1={0}
        x2={width}
        y1={median}
        y2={median}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH + 1}
      />
      
      {/* Outliers */}
      {outliers.map((outlier, idx) => (
        <circle
          key={idx}
          cx={width / 2}
          cy={outlier}
          r={3}
          fill="#ef4444"
          stroke="#dc2626"
          strokeWidth={1}
        />
      ))}
    </g>
  );
};

export const BoxPlot = ({ 
  data, 
  width = 600, 
  height = 400, 
  boxWidth = 50,
  showPoints = false,
  showGrid = true 
}) => {
  const [hoveredBox, setHoveredBox] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  const margin = { top: 20, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Calcular escala
  const globalMin = Math.min(...data.flatMap(d => d.values || [d.min]));
  const globalMax = Math.max(...data.flatMap(d => d.values || [d.max]));
  const range = globalMax - globalMin;
  const padding = range * 0.4;
  
  const scale = (value) => 
    chartHeight - ((value - (globalMin - padding)) / (range + 2 * padding)) * chartHeight + padding;
  
  // Generar líneas de la cuadrícula
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const value = (globalMin - padding) + (range + 2 * padding) * (i / numGridLines);
    gridLines.push({
      y: scale(value),
      value: value.toFixed(1)
    });
  }
  
  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Cuadrícula */}
        {showGrid && gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={0}
              x2={chartWidth}
              y1={line.y}
              y2={line.y}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            <text
              x={-10}
              y={line.y + 4}
              textAnchor="end"
              fontSize={11}
              fill="#6b7280"
            >
              {line.value}
            </text>
          </g>
        ))}
        
        {/* Eje Y */}
        <line
          x1={0}
          x2={0}
          y1={0}
          y2={chartHeight}
          stroke="#374151"
          strokeWidth={2}
        />
        
        {/* Box plots y puntos */}
        {data.map((d, i) => {
          const x = i * (chartWidth / data.length) + (chartWidth / data.length - boxWidth) / 2;
          const centerX = x + boxWidth / 2;
          
          // Calcular outliers si hay valores
          const outliers = [];
          const iqr = d.q3 - d.q1;
          const lowerFence = d.q1 - 1.5 * iqr;
          const upperFence = d.q3 + 1.5 * iqr;
          
          if (d.values) {
            d.values.forEach(value => {
              if (value < lowerFence || value > upperFence) {
                outliers.push(scale(value));
              }
            });
          }
          
          return (
            <g key={i}>
              {/* Puntos de datos reales con jitter */}
              {showPoints && d.values && d.values.map((value, idx) => {
                const isOutlier = value < lowerFence || value > upperFence;
                if (isOutlier) return null; // Los outliers ya se muestran en el box
                
                const jitter = (Math.random() - 0.5) * (boxWidth * 0.6);
                const pointX = centerX + jitter;
                const pointY = scale(value);
                
                return (
                  <circle
                    key={idx}
                    cx={pointX}
                    cy={pointY}
                    r={hoveredPoint === `${i}-${idx}` ? 5 : 3}
                    fill={hoveredBox === i ? "#6366f1" : "#94a3b8"}
                    opacity={hoveredBox === i ? 0.8 : 0.4}
                    stroke={hoveredPoint === `${i}-${idx}` ? "#4f46e5" : "none"}
                    strokeWidth={2}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={() => {
                      setHoveredBox(i);
                      setHoveredPoint(`${i}-${idx}`);
                    }}
                    onMouseLeave={() => {
                      setHoveredBox(null);
                      setHoveredPoint(null);
                    }}
                  />
                );
              })}
              
              {/* Box plot */}
              <g 
                transform={`translate(${x},0)`}
                onMouseEnter={() => setHoveredBox(i)}
                onMouseLeave={() => setHoveredBox(null)}
                style={{ cursor: 'pointer' }}
              >
                <VerticalBox
                  min={scale(d.min)}
                  q1={scale(d.q1)}
                  median={scale(d.median)}
                  q3={scale(d.q3)}
                  max={scale(d.max)}
                  width={boxWidth}
                  stroke={hoveredBox === i ? "#4f46e5" : "#334155"}
                  fill={hoveredBox === i ? "#818cf8" : "#a5b4fc"}
                  outliers={outliers}
                />
                
                {/* Etiqueta */}
                <text
                  x={boxWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={hoveredBox === i ? "600" : "400"}
                  fill="#1f2937"
                >
                  {d.label}
                </text>
                
                {/* Tooltip con estadísticas */}
                {hoveredBox === i && (
                  <g>
                    <rect
                      x={boxWidth + 10}
                      y={scale(d.q3) - 70}
                      width={120}
                      height={95}
                      fill="white"
                      stroke="#d1d5db"
                      strokeWidth={1}
                      rx={4}
                      filter="url(#shadow)"
                    />
                    <text x={boxWidth + 20} y={scale(d.q3) - 52} fontSize={11} fontWeight="600" fill="#1f2937">
                      {d.label}
                    </text>
                    <text x={boxWidth + 20} y={scale(d.q3) - 37} fontSize={10} fill="#6b7280">
                      Max: {d.max.toFixed(2)}
                    </text>
                    <text x={boxWidth + 20} y={scale(d.q3) - 25} fontSize={10} fill="#6b7280">
                      Q3: {d.q3.toFixed(2)}
                    </text>
                    <text x={boxWidth + 20} y={scale(d.q3) - 13} fontSize={10} fill="#4f46e5" fontWeight="600">
                      Med: {d.median.toFixed(2)}
                    </text>
                    <text x={boxWidth + 20} y={scale(d.q3) - 1} fontSize={10} fill="#6b7280">
                      Q1: {d.q1.toFixed(2)}
                    </text>
                    <text x={boxWidth + 20} y={scale(d.q3) + 11} fontSize={10} fill="#6b7280">
                      Min: {d.min.toFixed(2)}
                    </text>
                    {d.values && (
                      <text x={boxWidth + 20} y={scale(d.q3) + 23} fontSize={10} fill="#6b7280">
                        n = {d.values.length}
                      </text>
                    )}
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </g>
      
      {/* Sombra para tooltip */}
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>
    </svg>
  );
};