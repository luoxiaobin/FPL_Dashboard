'use client';

import { useEffect, useState } from 'react';
import { 
  ComposedChart,
  Line, 
  Bar,
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
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>GW {label}</p>
        <div className={styles.tooltipItem} style={{ color: '#22c55e' }}>
          <span>Total Points:</span> <span>{payload[1].value}</span>
        </div>
        <div className={styles.tooltipItem} style={{ color: '#38bdf8' }}>
          <span>Overall Rank:</span> <span>{payload[2].value.toLocaleString()}</span>
        </div>
        <div className={styles.tooltipItem} style={{ color: '#94a3b8' }}>
          <span>GW Points:</span> <span>{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function HistoryChart() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/user/history')
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          setHistory(data.current);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.container} style={{ textAlign: 'center', opacity: 0.5 }}>Loading Trajectory...</div>;
  if (!history.length) return null;

  const current = history[history.length - 1];
  const bestRank = Math.min(...history.map(h => h.overall_rank));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Season Trajectory</h2>
        <div className={styles.statsRow}>
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
            
            {/* Left Axis: Points */}
            <YAxis 
              yAxisId="points" 
              stroke="#22c55e" 
              tick={{fill: '#64748b', fontSize: 10}}
              orientation="left"
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 50', 'dataMax + 50']}
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
            
            {/* GW Points Bar (Background) */}
            <Bar
              yAxisId="points"
              dataKey="points"
              fill="rgba(56, 189, 248, 0.05)"
              barSize={20}
              name="GW Points"
            />

            {/* Total Points Line */}
            <Line 
              yAxisId="points"
              type="stepAfter" 
              dataKey="total_points" 
              name="Total Points" 
              stroke="#22c55e" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4 }}
            />

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
