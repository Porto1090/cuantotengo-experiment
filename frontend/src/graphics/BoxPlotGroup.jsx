import React, { useState } from "react";
import { VerticalBox } from "./BoxPlot"; // Importamos el componente base desde el otro archivo

export const BoxPlotGroup = ({ data, width = 800, height = 400 }) => {
  const [hoveredBox, setHoveredBox] = useState(null);
  
  const margin = { top: 40, right: 40, bottom: 100, left: 60 }; // Aumenté top y bottom para leyendas y rotaciones
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const metrics = ['qualtrics', 'azure'];
  const colors = {
    qualtrics: { fill: '#a5b4fc', stroke: '#6366f1' },
    azure: { fill: '#93c5fd', stroke: '#3b82f6' },
  };
  
  // Extraer nombres de marcas (asumiendo que ambas métricas tienen las mismas marcas)
  const brands = data.qualtrics ? data.qualtrics.map(d => d.label) : [];
  
  // Calcular escala global de forma segura
  const allValues = metrics.flatMap(metric =>
    (data[metric] || []).map(d => [d.min, d.max]).flat()
  ).filter(v => v != null && !isNaN(v));
  
  const globalMin = allValues.length ? Math.min(...allValues) : 0;
  const globalMax = allValues.length ? Math.max(...allValues) : 10;
  let range = globalMax - globalMin;
  if (range === 0) range = 10;
  
  const padding = range * 0.1;
  const scale = (value) => {
     if (value == null || isNaN(value)) return chartHeight;
     return chartHeight - ((value - (globalMin - padding)) / (range + 2 * padding)) * chartHeight;
  };
  
  const boxWidth = 20;
  // Calculamos el ancho de cada "grupo" basado en la cantidad real de marcas
  const numBrands = brands.length || 1; 
  const groupWidth = chartWidth / numBrands;
  const groupPadding = 10;
  
  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        
        {/* Leyenda Arriba */}
        <g transform={`translate(0, -30)`}>
          {metrics.map((metric, i) => (
            <g key={`legend-${metric}`} transform={`translate(${i * 120}, 0)`}>
              <rect width={15} height={15} fill={colors[metric].fill} stroke={colors[metric].stroke} rx={2} />
              <text x={24} y={12} fontSize={12} fill="#374151" fontWeight="500">
                {metric === 'qualtrics' ? 'Qualtrics' : 'Azure'}
              </text>
            </g>
          ))}
        </g>

        {/* Grid Horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const value = (globalMin - padding) + (range + 2 * padding) * pct;
          const y = scale(value);
          return (
             <g key={`grid-${i}`}>
              <line x1={0} x2={chartWidth} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="2,2" />
              <text x={-10} y={y + 4} textAnchor="end" fontSize={11} fill="#6b7280">
                {Math.max(0, value).toFixed(1)}
              </text>
            </g>
          );
        })}
        
        {/* Grupos por marca (EL MAP QUE FALTABA) */}
        {brands.map((brandName, brandIdx) => {
          const groupX = brandIdx * groupWidth;
          
          return (
            <g key={`brand-${brandIdx}`}>
              {/* Fondo intercalado para separar marcas visualmente */}
              <rect
                x={groupX}
                y={0}
                width={groupWidth}
                height={chartHeight}
                fill={brandIdx % 2 === 0 ? '#f8fafc' : 'transparent'}
              />
              
              {/* Box plots para cada métrica */}
              {metrics.map((metric, metricIdx) => {
                // Encontrar los stats para esta marca en esta métrica
                const statsArray = data[metric] || [];
                const stats = statsArray.find(d => d.label === brandName);
                
                if (!stats || isNaN(stats.min)) return null;
                
                // Centrar los boxes dentro de su grupo
                const offset = metricIdx === 0 ? -15 : 15; 
                const x = groupX + (groupWidth / 2) - (boxWidth / 2) + offset;
                const hoverKey = `${brandIdx}-${metric}`;
                const isHovered = hoveredBox === hoverKey;
                
                return (
                  <g
                    key={`box-${metric}`}
                    transform={`translate(${x},0)`}
                    onMouseEnter={() => setHoveredBox(hoverKey)}
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
                      stroke={isHovered ? colors[metric].stroke : '#475569'}
                      fill={colors[metric].fill}
                    />
                    
                    {/* Tooltip */}
                    {isHovered && (
                      <g>
                        <rect x={boxWidth + 5} y={scale(stats.q3) - 50} width={100} height={70} fill="white" stroke="#cbd5e1" rx={4} filter="url(#shadow)" />
                        <text x={boxWidth + 12} y={scale(stats.q3) - 35} fontSize={11} fontWeight="bold">{metric}</text>
                        <text x={boxWidth + 12} y={scale(stats.q3) - 20} fontSize={10} fill="#64748b">Max: {stats.max}</text>
                        <text x={boxWidth + 12} y={scale(stats.q3) - 8} fontSize={10} fill="#64748b">Med: {stats.median}</text>
                        <text x={boxWidth + 12} y={scale(stats.q3) + 4} fontSize={10} fill="#64748b">Min: {stats.min}</text>
                      </g>
                    )}
                  </g>
                );
              })}
              
              {/* Etiqueta de marca rotada (Para que no se encimen) */}
              <text
                x={groupX + groupWidth / 2}
                y={chartHeight + 15}
                textAnchor="end"
                fontSize={11}
                fontWeight="500"
                fill="#334155"
                transform={`rotate(-35 ${groupX + groupWidth / 2} ${chartHeight + 15})`}
              >
                {brandName.length > 15 ? brandName.substring(0, 15) + "..." : brandName}
              </text>
            </g>
          );
        })}
      </g>
      
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>
    </svg>
  );
};