'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface DataPoint {
  label: string
  completadas: number
  pendientes: number
}

interface Props { data: DataPoint[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#12121f',
      border: '1px solid rgba(124,106,247,0.2)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: '#9191a8', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill, fontWeight: 600 }}>
          {p.value} {p.name}
        </p>
      ))}
    </div>
  )
}

export function CompletionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={3} barCategoryGap="30%">
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10.5, fill: '#4e4e66' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10.5, fill: '#4e4e66' }}
          axisLine={false}
          tickLine={false}
          width={24}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,106,247,0.05)' }} />
        <Bar dataKey="completadas" name="completadas" radius={[5, 5, 0, 0]} fill="#7c6af7" />
        <Bar dataKey="pendientes" name="pendientes" radius={[5, 5, 0, 0]} fill="rgba(124,106,247,0.18)" />
      </BarChart>
    </ResponsiveContainer>
  )
}
