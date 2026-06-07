'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface DataPoint {
  course: string
  total: number
  completadas: number
}

interface Props { data: DataPoint[] }

const COLORS = ['#7c6af7','#a78bfa','#818cf8','#6366f1','#c4b5fd','#8b5cf6','#7c3aed']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as DataPoint
  const pct = d.total > 0 ? Math.round((d.completadas / d.total) * 100) : 0
  return (
    <div style={{
      background: '#12121f',
      border: '1px solid rgba(124,106,247,0.2)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: '#f0f0f8', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#9191a8' }}>{d.total} tareas · {pct}% completadas</p>
    </div>
  )
}

export function SubjectChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.total - a.total).slice(0, 7)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={sorted} layout="vertical" barCategoryGap="25%">
        <XAxis
          type="number"
          tick={{ fontSize: 10.5, fill: '#4e4e66' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="course"
          tick={{ fontSize: 11, fill: '#9191a8' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,106,247,0.05)' }} />
        <Bar dataKey="total" name="tareas" radius={[0, 5, 5, 0]}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
