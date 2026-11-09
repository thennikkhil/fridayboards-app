'use client'
import { useState } from 'react'
import type { WidgetProps } from './registry'

export function Counter({ data, updateData }: WidgetProps) {
  const [step, setStep] = useState(1) // LOCAL state: only this browser sees it
  const count = Number(data.count ?? 0) // SHARED state: lives in Liveblocks
  const btn = { padding: '6px 14px', border: '1.5px solid var(--ink, #24231f)', borderRadius: 10, background: 'transparent', fontSize: 18, cursor: 'pointer' } as const
  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
      <input
        value={data.label ?? ''}
        placeholder="What are we counting?"
        onChange={(e) => updateData({ label: e.target.value })}
        style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', border: 0, borderBottom: '1.5px solid var(--ink, #24231f)', background: 'transparent', outline: 0, padding: 4 }}
      />
      <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{count}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={btn} onClick={() => updateData({ count: count - step })}>−</button>
        <button style={btn} onClick={() => updateData({ count: count + step })}>+</button>
        <button style={btn} title="Step size (only you see this)" onClick={() => setStep((s) => (s === 1 ? 5 : s === 5 ? 10 : 1))}>×{step}</button>
      </div>
    </div>
  )
}
