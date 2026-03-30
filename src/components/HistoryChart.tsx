'use client';

import { useEffect, useState } from 'react';
import { 
  ComposedChart,
  Line, 
  Bar,
  Cell,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import styles from './HistoryChart.module.css';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const diff = data.points - data.avg_score;
    const diffColor = diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : '#94a3b8';
    
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>GW {label}</p>
        <div className={styles.tooltipItem}>
          <span style={{ color: '#e2e8f0' }}>GW Points:</span> 
          <span style={{ fontWeight: 800 }}>{data.points}</span>
        </div>
        <div className={styles.tooltipItem} style={{ fontSize: '0.7rem', opacity: 0.8 }}>
          <span>FPL Average:</span> <span>{data.avg_score}</span>
        </div>
        <div className={styles.tooltipItem} style={{ color: diffColor, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '4px' }}>
          <span>Vs Average:</span> <span>{diff > 0 ? '+' : ''}{diff}</span>
        </div>
        <div className={styles.tooltipItem} style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '8px' }}>
          <span>Total Points:</span> <span>{data.total_points}</span>
        </div>
        <div className={styles.tooltipItem} style={{ color: '#38bdf8' }}>
          <span>Overall Rank:</span> <span>{data.overall_rank.toLocaleString()}</span>
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
        // Enchant data with average range for shading
        const enriched = hData.current.map((h: any) => ({
          ...h,
          avg_low: Math.max(0, h.avg_score - 5),
          avg_high: h.avg_score + 5
        }));
        setHistory(enriched);
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

  const chipLabels: Record<string, string> = {
    'bboost': 'BB',
    '3xc': 'TC',
    'wildcard': 'WC',
    'freehit': 'FH'
  };

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
          <ComposedChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="event" 
              stroke="#64748b" 
              tick={{fill: '#64748b', fontSize: 10}}
              axisLine={false}
              tickLine={false}
            />
            
            {/* Left Axis: GW Points */}
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
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />

            {/* Shaded Average Range */}
            <Area
              yAxisId="points"
              type="monotone"
              dataKey="avg_high"
              aria-label="Average High"
              stroke="transparent"
              fill="rgba(148, 163, 184, 0.1)"
              name="Avg Range"
            />
            <Area
              yAxisId="points"
              type="monotone"
              dataKey="avg_low"
              aria-label="Average Low"
              stroke="transparent"
              fill="transparent"
            />
            
            {/* Average Line */}
            <Line 
              yAxisId="points"
              type="monotone" 
              dataKey="avg_score" 
              name="FPL Average" 
              stroke="#94a3b8" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
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
                <Cell key={`cell-${index}`} fill={getBarColor(entry.points, entry.avg_score)} />
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
