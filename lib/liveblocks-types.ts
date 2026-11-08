import type { LiveMap, LiveObject } from '@liveblocks/client';

export type Layer = {
  kind: 'path' | 'rect' | 'triangle' | 'ellipse' | 'cylinder' | 'text' | 'note';
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  text?: string;
  points?: number[]; // flat [x,y,x,y...] relative to (x,y), paths only
  createdAt: number;
};

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      pen: number[] | null;
      selection: string[];
    };
    Storage: { layers: LiveMap<string, LiveObject<Layer>> };
    UserMeta: { id: string; info: { name: string; color: string } };
  }
}
