'use client';

import { useEffect, useState } from 'react';
import { 
  ComposedChart,
  Line, 
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceDot
} from 'recharts';
import styles from './HistoryChart.module.css';

const chipLabels: Record<string, string> = {
  'bboost': 'BB',
  '3xc': 'TC',
  'wildcard': 'WC',
  'freehit': 'FH'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pointsDiff = data.points - data.avg_points;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader}>
          <p className={styles.tooltipLabel}>GW {label}</p>
          {data.chip_name && (
            <span className={styles.chipMarkerBadge}>{chipLabels[data.chip_name] || data.chip_name}</span>
          )}
        </div>
        <div className={styles.tooltipItem} style={{ color: '#22c55e' }}>
          <span>Total Points:</span> <span>{data.total_points}</span>
        </div>
        <div className={styles.tooltipItem} style={{ color: '#38bdf8' }}>
          <span>Overall Rank:</span> <span>{data.overall_rank.toLocaleString()}</span>
        </div>
        <div className={styles.tooltipItem} style={{ color: '#94a3b8' }}>
          <span>GW Points:</span> <span>{data.points} ({pointsDiff > 0 ? `+${pointsDiff}` : pointsDiff} vs Avg)</span>
        </div>
        <div className={styles.tooltipItem} style={{ color: '#eab308' }}>
          <span>Team Value:</span> <span>£{data.team_value.toFixed(1)}m</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function HistoryChart() {
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/user/history').then(res => res.json()),
      fetch('/api/v1/user/summary').then(res => res.json())
    ]).then(([hData, sData]) => {
      if (hData?.current) {
        // Merge chips and calculate team value (divide by 10)
        const enrichedHistory = hData.current.map((h: any) => {
          const chip = hData.chips?.find((c: any) => c.event === h.event);
          return {
            ...h,
            team_value: (h.value + h.bank) / 10,
            avg_points: h.avg_points || h.avg_score || 0,
            chip_name: chip ? chip.name : null
          };
        });
        setHistory(enrichedHistory);
      }
      setSummary(sData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.container} style={{ textAlign: 'center', opacity: 0.5 }}>Loading Trajectory...</div>;
  if (!history.length || !summary) return null;

  const getBarColor = (points: number, avg: number) => {
    const diff = points - avg;
    if (diff > 20) return '#22c55e'; // Excellent
    if (diff > 5) return '#4ade80';  // Good
    if (diff < -15) return '#ef4444'; // Poor
    if (diff < -5) return '#f87171';  // Below Average
    return '#94a3b8'; // Average
  };

  const current = history[history.length - 1];
  const bestRank = Math.min(...history.map(h => h.overall_rank));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Season Trajectory</h2>
          <div className={styles.trendBadge} data-trend={summary.trend}>
            {summary.trend === 'Improving' ? '▲ Improving' : summary.trend === 'Declining' ? '▼ Declining' : '● Stable'}
          </div>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statBadge}>
            <span className={styles.statLabel}>Team Value</span>
            <span className={styles.statValue} style={{ color: '#eab308' }}>£{summary.total_value}m</span>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statLabel}>Season High</span>
            <span className={styles.statValue} style={{ color: '#38bdf8' }}>#{bestRank.toLocaleString()}</span>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statLabel}>Current Rank</span>
            <span className={styles.statValue}>#{current.overall_rank.toLocaleString()}</span>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statLabel}>Total Points</span>
            <span className={styles.statValue} style={{ color: '#22c55e' }}>{current.total_points}</span>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statLabel}>Chips Avail.</span>
            <div className={styles.chipsRow}>
              {(summary.available_chips || []).map((c: string) => (
                <span key={c} className={styles.chipTag}>{chipLabels[c] || c}</span>
              ))}
              {(!summary.available_chips || summary.available_chips.length === 0) && <span className={styles.noChips}>None</span>}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="event" 
              stroke="#64748b" 
              tick={{fill: '#64748b', fontSize: 10}}
              axisLine={false}
              tickLine={false}
            />
            
            {/* Left Axis: Points & Value */}
            <YAxis 
              yAxisId="points" 
              stroke="#e2e8f0" 
              tick={{fill: '#64748b', fontSize: 10}}
              orientation="left"
              axisLine={false}
              tickLine={false}
              domain={[0, 'dataMax + 20']}
            />
            
            {/* Right Axis: Log Rank */}
            <YAxis 
              yAxisId="rank" 
              stroke="#38bdf8" 
              tick={{fill: '#64748b', fontSize: 10}}
              orientation="right"
              reversed={true}
              scale="log"
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top" 
              align="right" 
              height={36} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}
            />
            
            {/* GW Avg Points (Dashed Background) */}
            <Line
              yAxisId="points"
              type="monotone"
              dataKey="avg_points"
              name="Avg Points"
              stroke="#475569"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* GW Points Bar */}
            <Bar
              yAxisId="points"
              dataKey="points"
              name="My GW Points"
              radius={[4, 4, 0, 0]}
              barSize={20}
            >
              {history.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.points, entry.avg_points)} />
              ))}
            </Bar>

            {/* Overall Rank Line */}
            <Line 
              yAxisId="rank"
              type="monotone" 
              dataKey="overall_rank" 
              name="Overall Rank" 
              stroke="#38bdf8" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* Team Value Line */}
            <Line
              yAxisId="points"
              type="monotone"
              dataKey="team_value"
              name="Team Value (£m)"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="2 2"
            />

            {/* Chips Markers */}
            {history.map((entry, index) => entry.chip_name && (
              <ReferenceDot 
                key={`chip-${index}`}
                yAxisId="points"
                x={entry.event}
                y={entry.points}
                r={12}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={2}
                label={{ 
                  value: chipLabels[entry.chip_name] || entry.chip_name, 
                  position: 'center', 
                  fill: '#0f172a', 
                  fontSize: 10, 
                  fontWeight: 800 
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
