'use client';

import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import styles from './HistoryChart.module.css';

// Custom Tooltip formatter moved outside to prevent re-creation during render
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', padding: '10px', border: '1px solid #334155', borderRadius: '8px' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>GW {label}</p>
        <p style={{ margin: '0', color: '#22c55e' }}>Points: {payload[0].value}</p>
        <p style={{ margin: '0', color: '#38bdf8' }}>Rank: {payload[1].value.toLocaleString()}</p>
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

  if (loading) return <div className={styles.container} style={{ textAlign: 'center', opacity: 0.5 }}>Loading Chart...</div>;
  if (!history.length) return null;


  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Season Trajectory</h2>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="event" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
            
            {/* Left Y Axis for Points */}
            <YAxis 
              yAxisId="points" 
              stroke="#22c55e" 
              tick={{fill: '#94a3b8'}}
              orientation="left"
            />
            
            {/* Right Y Axis for Overall Rank (Reversed so lower rank is visually higher) */}
            <YAxis 
              yAxisId="rank" 
              stroke="#38bdf8" 
              tick={{fill: '#94a3b8'}}
              orientation="right"
              reversed={true}
              domain={['auto', 'auto']}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36}/>
            
            <Line 
              yAxisId="points"
              type="monotone" 
              dataKey="points" 
              name="GW Points" 
              stroke="#22c55e" 
              strokeWidth={3}
              activeDot={{ r: 6 }} 
              dot={false}
            />
            <Line 
              yAxisId="rank"
              type="monotone" 
              dataKey="overall_rank" 
              name="Overall Rank" 
              stroke="#38bdf8" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
