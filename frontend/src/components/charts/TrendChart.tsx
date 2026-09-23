import React from 'react'
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts'
import { useTwinStore } from '../../store/twinStore'

interface Props {
  data: { ts: string; value: number }[]
  color?: string
  threshold?: number
  height?: number
  unit?: string
}

export function TrendChart({ data, color = '#0284C7', threshold, height = 80, unit = '' }: Props) {
  const theme = useTwinStore((s) => s.theme)
  const isDark = theme === 'dark'

  const formatted = data.map((d) => ({
    time: new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: d.value,
  }))

  const tickColor = isDark ? '#9AA3AC' : '#64748B'
  const tooltipBg = isDark ? '#1B1F24' : '#FFFFFF'
  const tooltipBorder = isDark ? '#33383F' : '#CBD5E1'
  const tooltipLabel = isDark ? '#9AA3AC' : '#64748B'
  const lineColor = isDark && color === '#0284C7' ? '#8ECDFF' : color

  // Compute dynamic domain to guarantee the threshold line is always visible
  const values = data.map((d) => d.value)
  const maxVal = Math.max(...values, threshold ?? 0)
  const minVal = Math.min(...values, 0)
  const yDomain = [Math.max(0, Math.floor(minVal * 0.9)), Math.ceil(maxVal * 1.15)]

  const gradId = `grad-${color.replace('#', '')}-${Math.floor(Math.random() * 1000)}`

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={isDark ? 0.35 : 0.25} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 9, fill: tickColor, fontFamily: 'JetBrains Mono, monospace' }}
          interval="preserveStartEnd"
          minTickGap={25}
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 9, fill: tickColor, fontFamily: 'JetBrains Mono, monospace' }}
        />
        <Tooltip
          contentStyle={{
            background: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 6,
            fontSize: 11,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          }}
          formatter={(value: any) => [`${value} ${unit}`, 'Value']}
          itemStyle={{ color: lineColor, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
          labelStyle={{ color: tooltipLabel, fontSize: 10, marginBottom: 2 }}
        />
        {threshold !== undefined && (
          <ReferenceLine
            y={threshold}
            stroke="#F59E0B"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: `Limit: ${threshold}${unit}`,
              fill: '#F59E0B',
              fontSize: 9,
              position: 'insideTopRight',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          fill={`url(#${gradId})`}
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
