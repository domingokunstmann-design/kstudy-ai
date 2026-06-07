'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  label: string
  horas: number
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
      <p style={{ color: '#a89dff', fontWeight: 600 }}>{payload[0].value.toFixed(1)}h estudiadas</p>
    </div>
  )
}

export function StudyTimeChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7c6af7" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7c6af7" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          width={28}
          tickFormatter={(v) => `${v}h`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(124,106,247,0.2)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="horas"
          stroke="#7c6af7"
          strokeWidth={2}
          fill="url(#studyGrad)"
          dot={{ fill: '#7c6af7', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#a89dff', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
