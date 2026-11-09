import type { ComponentType } from 'react'
import { Counter } from './counter'
import { YouTube } from "./youtube"

export type WidgetData = Record<string, any>
export type WidgetProps = { data: WidgetData; updateData: (patch: WidgetData) => void }
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
}
