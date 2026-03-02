import React, { useState } from "react";
export const BoxPlotGroup = ({ data, width = 800, height = 400 }) => {
  const [hoveredBox, setHoveredBox] = useState(null);
  
  const margin = { top: 20, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const metrics = ['qualtrics', 'azure'];
  const colors = {
    qualtrics: { fill: '#a5b4fc', stroke: '#6366f1' },
    azure: { fill: '#93c5fd', stroke: '#3b82f6' },
  };
  
  // Calcular escala global
  const allValues = metrics.flatMap(metric =>
    (data[metric] || []).map(d => [d.min, d.q1, d.median, d.q3, d.max]).flat()
  );
  const globalMin = Math.min(...allValues);
  const globalMax = Math.max(...allValues);
  const range = globalMax - globalMin;
  const padding = range * 0.1;
  
  const scale = (value) => 
    chartHeight - ((value - (globalMin - padding)) / (range + 2 * padding)) * chartHeight;
  
  const boxWidth = 25;
  const groupWidth = chartWidth / data.length;
  const groupPadding = 10;
  
  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const value = (globalMin - padding) + (range + 2 * padding) * pct;
          const y = scale(value);
          return (
            <g key={i}>
              <line x1={0} x2={chartWidth} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="2,2" />
              <text x={-10} y={y + 4} textAnchor="end" fontSize={11} fill="#6b7280">
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}
        
        {/* Grupos por marca */}
        { 
        ((brandData, brandIdx) => {
          const groupX = brandIdx * groupWidth;
          
          return (
            <g key={brandIdx}>
              {/* Fondo del grupo */}
              <rect
                x={groupX + groupPadding / 2}
                y={0}
                width={groupWidth - groupPadding}
                height={chartHeight}
                fill={brandIdx % 2 === 0 ? '#f9fafb' : 'transparent'}
                opacity={0.5}
              />
              
              {/* Box plots para cada métrica */}
              {metrics.map((metric, metricIdx) => {
                const stats = brandData[metric];
                if (!stats || !stats.values || stats.values.length === 0) return null;
                
                const x = groupX + groupPadding + metricIdx * (boxWidth + 5);
                const isHovered = hoveredBox === `${brandIdx}-${metric}`;
                
                return (
                  <g
                    key={metric}
                    transform={`translate(${x},0)`}
                    onMouseEnter={() => setHoveredBox(`${brandIdx}-${metric}`)}
                    onMouseLeave={() => setHoveredBox(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <VerticalBox
                      min={scale(stats.min)}
                      q1={scale(stats.q1)}
                      median={scale(stats.median)}
                      q3={scale(stats.q3)}
                      max={scale(stats.max)}
                      width={boxWidth}
                      stroke={isHovered ? colors[metric].stroke : '#334155'}
                      fill={isHovered ? colors[metric].fill : colors[metric].fill}
                      outliers={[]}
                    />
                    
                    {/* Tooltip */}
                    {isHovered && (
                      <g>
                        <rect
                          x={boxWidth + 10}
                          y={scale(stats.q3) - 60}
                          width={110}
                          height={80}
                          fill="white"
                          stroke="#d1d5db"
                          rx={4}
                          filter="url(#shadow)"
                        />
                        <text x={boxWidth + 20} y={scale(stats.q3) - 42} fontSize={11} fontWeight="600">
                          {metric}
                        </text>
                        <text x={boxWidth + 20} y={scale(stats.q3) - 28} fontSize={10} fill="#6b7280">
                          Max: {stats.max}
                        </text>
                        <text x={boxWidth + 20} y={scale(stats.q3) - 16} fontSize={10} fill="#6b7280">
                          Q3: {stats.q3}
                        </text>
                        <text x={boxWidth + 20} y={scale(stats.q3) - 4} fontSize={10} fontWeight="600">
                          Med: {stats.median}
                        </text>
                        <text x={boxWidth + 20} y={scale(stats.q3) + 8} fontSize={10} fill="#6b7280">
                          Q1: {stats.q1}
                        </text>
                        <text x={boxWidth + 20} y={scale(stats.q3) + 20} fontSize={10} fill="#6b7280">
                          Min: {stats.min}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              
              {/* Etiqueta de marca */}
              <text
                x={groupX + groupWidth / 2}
                y={chartHeight + 25}
                textAnchor="middle"
                fontSize={12}
                fontWeight="500"
                fill="#1f2937"
              >
                {brandData.label}
              </text>
              <text
                x={groupX + groupWidth / 2}
                y={chartHeight + 40}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
              >
                (n={brandData.count})
              </text>
            </g>
          );
        })}
        
        {/* Leyenda */}
        <g transform={`translate(${chartWidth - 300}, -10)`}>
          {metrics.map((metric, i) => (
            <g key={metric} transform={`translate(${i * 100}, 0)`}>
              <rect width={15} height={15} fill={colors[metric].fill} stroke={colors[metric].stroke} />
              <text x={20} y={12} fontSize={11} fill="#374151">
                {metric}
              </text>
            </g>
          ))}
        </g>
      </g>
      
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>
    </svg>
  );
};