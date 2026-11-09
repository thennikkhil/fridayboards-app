'use client'
import { useEffect, useRef, useState } from 'react'
import type { WSnap, WidgetDef, WidgetData } from './registry'

const BAR = 36

type Props = {
  w: WSnap
  def: WidgetDef
  scale: number
  focused: boolean
  color: string
  onFocus: () => void
  gesture: (on: boolean) => void
  patch: (p: Partial<Omit<WSnap, 'id' | 'data'>>) => void
  updateData: (p: WidgetData) => void
  duplicate: () => void
  remove: () => void
}

export function WidgetShell({ w, def, scale, focused, color, onFocus, gesture, patch, updateData, duplicate, remove }: Props) {
  const [busy, setBusy] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const drag = useRef<{ kind: 'move' | 'resize'; sx: number; sy: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    const el = body.current
    if (!el) return
    const stop = (e: WheelEvent) => { if (!e.ctrlKey && !e.metaKey) e.stopPropagation() }
    el.addEventListener('wheel', stop)
    return () => el.removeEventListener('wheel', stop)
  }, [w.isCollapsed])

  const start = (kind: 'move' | 'resize') => (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation()
    if (w.isLocked || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    gesture(true)
    setBusy(true)
    drag.current = { kind, sx: e.clientX, sy: e.clientY, ox: kind === 'move' ? w.x : w.w, oy: kind === 'move' ? w.y : w.h }
    if (kind === 'move') patch({ z: Date.now() })
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    e.stopPropagation()
    const dx = (e.clientX - d.sx) / scale
    const dy = (e.clientY - d.sy) / scale
    if (d.kind === 'move') patch({ x: d.ox + dx, y: d.oy + dy })
    else patch({ w: Math.max(def.minSize.w, d.ox + dx), h: Math.max(def.minSize.h, d.oy + dy) })
  }
  const end = (e: React.PointerEvent) => {
    if (!drag.current) return
    e.stopPropagation()
    drag.current = null
    setBusy(false)
    gesture(false)
  }

  const C = def.Component
  const sb = { background: 'transparent', border: 0, cursor: 'pointer', fontSize: 14, padding: '0 4px' } as const
  const noDrag = { onPointerDown: (e: React.PointerEvent) => e.stopPropagation() }

  return (
    <div
      onPointerDown={(e) => { e.stopPropagation(); onFocus() }}
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', left: w.x, top: w.y, width: w.w, height: w.isCollapsed ? BAR : w.h,
        pointerEvents: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 12,
        background: 'var(--paper, #fff)', border: '1.5px solid var(--ink, #24231f)',
        boxShadow: focused ? `0 0 0 3px ${color}` : '0 8px 20px rgba(0,0,0,.12)',
      }}
    >
      <div
        onPointerDown={start('move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
        style={{ height: BAR, flex: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', background: 'rgba(0,0,0,.05)', cursor: w.isLocked ? 'default' : 'grab', touchAction: 'none', userSelect: 'none' }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600 }}>
          {def.icon} {w.title}
        </span>
        <button {...noDrag} style={sb} title={w.isLocked ? 'Unlock' : 'Lock'} onClick={() => patch({ isLocked: !w.isLocked })}>{w.isLocked ? '🔒' : '🔓'}</button>
        <button {...noDrag} style={sb} title={w.isCollapsed ? 'Expand' : 'Collapse'} onClick={() => patch({ isCollapsed: !w.isCollapsed })}>{w.isCollapsed ? '▸' : '▾'}</button>
        <button {...noDrag} style={sb} title="Duplicate" onClick={duplicate}>⧉</button>
        <button {...noDrag} style={{ ...sb, opacity: w.isLocked ? 0.3 : 1 }} title="Delete" disabled={w.isLocked} onClick={remove}>✕</button>
      </div>
      {!w.isCollapsed && (
        <div ref={body} style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'auto' }}>
          <C data={w.data} updateData={updateData} />
          {busy && <div style={{ position: 'absolute', inset: 0 }} />}
        </div>
      )}
      {!w.isCollapsed && !w.isLocked && (
        <div
          onPointerDown={start('resize')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
          style={{ position: 'absolute', right: 0, bottom: 0, width: 18, height: 18, cursor: 'nwse-resize', touchAction: 'none', background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,.35) 50%)' }}
        />
      )}
    </div>
  )
}
