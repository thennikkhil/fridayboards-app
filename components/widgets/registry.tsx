import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { Counter } from './counter'
import { YouTube } from "./youtube"

const CallWidgetComponent = dynamic(
  () => import("./call").then((mod) => mod.callWidget.Component),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
        Loading call…
      </div>
    ),
  },
) as ComponentType<WidgetProps>

const PdfWidgetComponent = dynamic(
  () => import('./pdf').then((mod) => mod.pdfWidget.Component),
  { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>Loading PDF…</div> },
) as ComponentType<WidgetProps>

const NotesWidgetComponent = dynamic(
  () => import('./notes/NotesWidget').then((mod) => mod.NotesWidget),
  { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>Loading notes…</div> },
) as ComponentType<WidgetProps>

export type WidgetData = Record<string, any>
export type WidgetProps = {
  data: WidgetData
  updateData: (patch: WidgetData) => void
  widgetId: string
  scale: number
  isLocked: boolean
}
export type WidgetDef = {
  type: string
  name: string
  icon: string
  defaultSize: { w: number; h: number }
  minSize: { w: number; h: number }
  initialData: () => WidgetData
  Component: ComponentType<WidgetProps>
}
// what the board hands to the shell: one widget's snapshot from Liveblocks storage
export type WSnap = {
  id: string; widgetType: string
  x: number; y: number; w: number; h: number
  title: string; isCollapsed: boolean; isLocked: boolean
  createdBy: string; z: number
  data: WidgetData
}

export const WIDGETS: Record<string, WidgetDef> = {
  counter: {
    type: 'counter',
    name: 'Sticky counter',
    icon: '🔢',
    defaultSize: { w: 260, h: 220 },
    minSize: { w: 200, h: 160 },
    initialData: () => ({ count: 0, label: '' }),
    Component: Counter,
  },
  youtube: {
    type: "youtube",
    name: "YouTube",
    icon: "▶️",
    defaultSize: { w: 480, h: 360 },
    minSize: { w: 320, h: 260 },
    initialData: () => ({ videoId: "", isPlaying: false, positionSec: 0, updatedAt: 0, by: "" }),
    Component: YouTube,
  },
  pdf: {
    type: 'pdf',
    name: 'PDF',
    icon: '📄',
    defaultSize: { w: 640, h: 820 },
    minSize: { w: 360, h: 320 },
    initialData: () => ({ fileId: null, fileName: null }),
    Component: PdfWidgetComponent,
  },
  call: {
    type: "call",
    name: "Video call",
    icon: "📹",
    defaultSize: { w: 560, h: 420 },
    minSize: { w: 320, h: 260 },
    initialData: () => ({}),
    Component: CallWidgetComponent,
  },
  notes: {
    type: 'notes',
    name: 'Notes',
    icon: '📝',
    defaultSize: { w: 420, h: 520 },
    minSize: { w: 280, h: 240 },
    initialData: () => ({}),
    Component: NotesWidgetComponent,
  },
}
