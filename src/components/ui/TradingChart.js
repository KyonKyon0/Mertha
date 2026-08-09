import React, { useState } from 'react';
import { AreaChart, Area, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, Activity } from 'lucide-react';

export default function TradingChart({ 
  data = [], 
  title = "Active Users Detected",
  liveLabel = "Live",
  dataKey = "value",
  xAxisKey = "name",
  height = "h-[400px]",
  metricOptions = [],
  selectedMetric = "",
  onMetricChange = () => {}
}) {
  const [chartTimeframe, setChartTimeframe] = useState('ALL');

  // Filter data based on timeframe (dummy logic for visual demo, ideally filtered before passing)
  let displayData = [...data];
  if (chartTimeframe === '1D') displayData = data.slice(-1);
  else if (chartTimeframe === '1W') displayData = data.slice(-7);
  else if (chartTimeframe === '1M') displayData = data.slice(-30);
  
  if (displayData.length === 0) {
    // Prevent empty chart errors
    displayData = [{ [xAxisKey]: 'N/A', [dataKey]: 0 }];
  }

  // Calculate stats
  const maxVal = Math.max(...displayData.map(d => d[dataKey] || 0), 1);
  const minVal = Math.min(...displayData.map(d => d[dataKey] || 0), 0);
  const meanVal = displayData.length > 0 ? displayData.reduce((acc, curr) => acc + (curr[dataKey] || 0), 0) / displayData.length : 0;
  
  // Calculate gradient offset (where the mean line is, 0 to 1)
  const gradientOffset = () => {
    if (maxVal <= minVal) return 0;
    return (maxVal - meanVal) / (maxVal - minVal);
  };
  const off = gradientOffset();

  const currentValue = displayData[displayData.length - 1]?.[dataKey] || 0;
  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <div className="bg-[#111]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#333] shadow-2xl relative w-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-gray-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
            <Activity size={16}/> {title}
          </h3>
          <div className="text-4xl font-black text-white mt-1">
            {currentValue.toLocaleString()}
            {liveLabel && <span className="text-sm font-bold text-green-500 ml-3 bg-green-500/10 px-2 py-1 rounded">{liveLabel}</span>}
          </div>
        </div>
        
        {/* Metric Dropdown */}
        {metricOptions.length > 0 && (
          <div className="relative group z-50">
            <button className="flex items-center gap-2 bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              {metricOptions.find(m => m.value === selectedMetric)?.label || selectedMetric}
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#222] border border-[#444] rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {metricOptions.map(m => (
                <button 
                  key={m.value}
                  onClick={() => onMetricChange(m.value)}
                  className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-[#333] transition-colors ${selectedMetric === m.value ? 'text-yellow-500 bg-[#1a1a1a]' : 'text-gray-300'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`${height} w-full mt-4`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor="#10b981" stopOpacity={0.6} />
                <stop offset={off} stopColor="#10b981" stopOpacity={0.1} />
                <stop offset={off} stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset={1} stopColor="#ef4444" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="strokeChartLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor="#10b981" stopOpacity={1} />
                <stop offset={off} stopColor="#10b981" stopOpacity={1} />
                <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
                <stop offset={1} stopColor="#ef4444" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#555" 
              tick={{fill: '#888', fontSize: 11}} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#555" 
              tick={{fill: '#888', fontSize: 11}} 
              axisLine={false}
              tickLine={false}
              orientation="right"
              dx={10}
            />
            <RechartsTooltip 
              contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '12px'}} 
              itemStyle={{color: '#fff', fontWeight: 'bold'}}
              cursor={{stroke: '#555', strokeWidth: 1, strokeDasharray: '4 4'}}
            />
            <ReferenceLine 
              y={meanVal} 
              stroke="#666" 
              strokeDasharray="4 4" 
              label={{ position: 'insideTopLeft', value: `MEAN ${Math.round(meanVal)}`, fill: '#888', fontSize: 10 }}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke="url(#strokeChartLine)" 
              strokeWidth={3}
              fill="url(#colorChartFill)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeframe Buttons */}
      <div className="flex justify-center gap-2 mt-6 overflow-x-auto pb-2">
        {timeframes.map(tf => (
          <button 
            key={tf}
            onClick={() => setChartTimeframe(tf)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${chartTimeframe === tf ? 'bg-[#333] text-white shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-[#222]'}`}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}
