'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LiveMap, LiveObject, type LsonObject } from '@liveblocks/client';
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useStorage,
  useMutation,
  useOthers,
  useUpdateMyPresence,
  useSelf,
  useHistory,
  useCanUndo,
  useCanRedo,
} from '@liveblocks/react/suspense';
import getStroke from 'perfect-freehand';
import { nanoid } from 'nanoid';
import { NotebookPen, Video } from 'lucide-react';
import { toast } from 'sonner';
import { renameBoard } from '@/app/actions';
import type { Layer, WidgetLayer } from '@/lib/liveblocks-types';
import { isFromWidgetBody } from '@/lib/utils/widget-events';
import { AddPdfButton } from './widgets/pdf/add-pdf-button';
import { useCanvasPdfDrop } from './widgets/pdf/use-canvas-pdf-drop';
import { WIDGETS, type WSnap, type WidgetData } from './widgets/registry';
import { WidgetShell } from './widgets/widget-shell';
import { Icon, type IconName } from './ui-kit';

const tools: { name: IconName; label: string }[] = [
  { name: 'cursor', label: 'Select' },
  { name: 'pen', label: 'Draw' },
  { name: 'text', label: 'Text' },
  { name: 'shapes', label: 'Shapes' },
  { name: 'link', label: 'Sticky' },
  { name: 'image', label: 'Media' },
  { name: 'music', label: 'Music' },
];
type Props = {
  board: { id: string; title: string };
  user: { id: string; name: string };
  inviteCode: string;
};
type Item = Layer & { id: string };

const HINTS: Record<string, string> = {
  cursor:
    'Click to select, drag to move. Drag the corner to resize. Delete removes. Scroll to pan, Ctrl+scroll to zoom.',
  pen: 'Draw freely — everyone sees your strokes live.',
  text: 'Click to place text, then just type. Double-click any text, note or shape to edit it.',
  shapes: 'Pick a shape from the little panel, then drag on the canvas. Double-click a shape to write inside it.',
  link: 'Click to drop a sticky note and type straight away. Double-click to edit it later.',
  image: 'Pick a widget to drop it in the middle of your view. Drag its title bar to move it.',
  music: 'Focus tape is open — toggle it from the Music tool.',
  eraser: 'Drag over anything to erase it.',
};
const INK = '#24231f';

function pathD(flat: number[]) {
  const pts: number[][] = [];
  for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
  const s = getStroke(pts, { size: 5, thinning: 0.5, smoothing: 0.5, streamline: 0.5 });
  if (!s.length) return '';
  const d = s.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...s[0], 'Q'] as (string | number)[],
  );
  return d.concat('Z').join(' ');
}

const BLUE = '#2f7bff'; // neon blue border
const glow = { filter: 'drop-shadow(0 0 5px rgba(47,123,255,.7))' };
const lineCount = (t = '') => t.split('\n').length;

function renderLayer(l: Item, hide: string | null = null) {
  const hidden = hide === l.id; // text is being edited in the overlay
  if (l.kind === 'path')
    return (
      <path
        key={l.id}
        d={pathD(l.points ?? [])}
        transform={`translate(${l.x} ${l.y})`}
        fill={l.fill}
      />
    );
  if (l.kind === 'text')
    return (
      <text
        key={l.id}
        x={l.x}
        y={l.y}
        fontSize={24}
        fontFamily="DM Sans, sans-serif"
        fill={INK}
        dominantBaseline="hanging"
      >
        {!hidden &&
          (l.text ?? '').split('\n').map((line, i) => (
            <tspan key={i} x={l.x} dy={i ? 30 : 0}>
              {line}
            </tspan>
          ))}
      </text>
    );
  if (l.kind === 'note')
    return (
      <foreignObject key={l.id} x={l.x} y={l.y} width={l.w} height={l.h}>
        <div
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            padding: 14,
            background: l.fill,
            borderRadius: 6,
            boxShadow: '0 6px 14px rgba(0,0,0,.15)',
            font: '500 17px DM Sans, sans-serif',
            color: INK,
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
          }}
        >
          {!hidden && l.text}
        </div>
      </foreignObject>
    );
  const sp = { fill: 'none', stroke: BLUE, strokeWidth: 2.5, style: glow };
  const ry = Math.min(24, l.h * 0.18);
  return (
    <g key={l.id}>
      {l.kind === 'rect' && <rect x={l.x} y={l.y} width={l.w} height={l.h} rx={10} {...sp} />}
      {l.kind === 'ellipse' && (
        <ellipse cx={l.x + l.w / 2} cy={l.y + l.h / 2} rx={l.w / 2} ry={l.h / 2} {...sp} />
      )}
      {l.kind === 'triangle' && (
        <polygon
          points={`${l.x + l.w / 2},${l.y} ${l.x + l.w},${l.y + l.h} ${l.x},${l.y + l.h}`}
          strokeLinejoin="round"
          {...sp}
        />
      )}
      {l.kind === 'cylinder' && (
        <g {...sp}>
          <path
            d={`M${l.x},${l.y + ry} L${l.x},${l.y + l.h - ry} A${l.w / 2},${ry} 0 0 0 ${l.x + l.w},${l.y + l.h - ry} L${l.x + l.w},${l.y + ry}`}
          />
          <ellipse cx={l.x + l.w / 2} cy={l.y + ry} rx={l.w / 2} ry={ry} />
        </g>
      )}
      {l.text && !hidden && (
        <foreignObject x={l.x} y={l.y} width={l.w} height={l.h} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              padding: '0 12%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              font: '500 18px DM Sans, sans-serif',
              color: INK,
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
            }}
          >
            {l.text}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function Whiteboard(props: Props) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={props.board.id}
        initialPresence={{ cursor: null, pen: null, selection: [] }}
        initialStorage={{
          layers: new LiveMap<string, LiveObject<Layer>>(),
          widgets: new LiveMap<string, LiveObject<WidgetLayer>>(),
        }}
      >
        <ClientSideSuspense fallback={<div className="whiteboard" />}>
          <Board {...props} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

type Gesture =
  | { t: 'pan'; sx: number; sy: number; cx: number; cy: number }
  | { t: 'move'; id: string; px: number; py: number; ox: number; oy: number }
  | { t: 'resize'; id: string; ox: number; oy: number }
  | { t: 'draw'; pts: number[] }
  | { t: 'shape'; x: number; y: number }
  | { t: 'place'; x: number; y: number }
  | { t: 'erase' };

function Board({ board, user, inviteCode }: Props) {
  const router = useRouter();
  const go = (_: string) => router.push('/dashboard');
  const [, startT] = useTransition();
  const [tool, setTool] = useState<IconName>('cursor');
  const [shape, setShape] = useState<'rect' | 'triangle' | 'ellipse' | 'cylinder'>('rect');
  const [editing, setEditing] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [player, setPlayer] = useState(false);
  const [shared, setShared] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [cam, setCam] = useState({ x: 0, y: 0, s: 1 });
  const [draft, setDraft] = useState<Layer | null>(null);
  const [pen, setPen] = useState<number[] | null>(null);
  const [goingHome, setGoingHome] = useState(false);
  const [titleSaved, setTitleSaved] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const isPdfOver = useCanvasPdfDrop({
    canvasRef: ref,
    camera: { x: cam.x, y: cam.y, scale: cam.s },
    boardId: board.id,
    userId: user.id,
  });
  const g = useRef<Gesture | null>(null);
  const space = useRef(false);

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const update = useUpdateMyPresence();
  const me = useSelf((m) => m.info);
  const mySel = useSelf((m) => m.presence.selection);
  const others = useOthers();
  const people = [user.name, ...others.map((o) => o.info.name)];

  // const map = useStorage((r) => r.layers) as unknown as ReadonlyMap<string, Layer>;

  const layers = useStorage((root) => root.layers);

  const items: Item[] = useMemo(() => {
    return Object.entries(layers ?? {})
      .map(([id, layer]) => {
        const item = { ...layer, id } as Partial<Item> & { id: string };
        if (item.points) item.points = [...item.points];
        return item as Item;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [layers]);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [focusedWidget, setFocusedWidget] = useState<string | null>(null);
  const wmap = useStorage((r) => r.widgets) as unknown as
    | ReadonlyMap<string, Omit<WSnap, 'id'>>
    | undefined;
  const widgets: WSnap[] = useMemo(() => {
    if (!wmap) return [];
    const entries: [string, Omit<WSnap, 'id'>][] =
      wmap instanceof Map ? Array.from(wmap.entries()) : Object.entries(wmap as object);
    return entries.map(([id, w]) => ({ id, ...w })).sort((a, b) => a.z - b.z);
  }, [wmap]);
  const insertWidget = useMutation(
    ({ storage }, id: string, w: Omit<WidgetLayer, 'data'>, data: LsonObject) => {
      let m = storage.get('widgets');
      if (!m) {
        m = new LiveMap<string, LiveObject<WidgetLayer>>();
        storage.set('widgets', m);
      }
      m.set(id, new LiveObject<WidgetLayer>({ ...w, data: new LiveObject(data) }));
    },
    [],
  );
  const patchWidget = useMutation(
    ({ storage }, id: string, p: Partial<Omit<WidgetLayer, 'data'>>) => {
      storage.get('widgets')?.get(id)?.update(p);
    },
    [],
  );
  const updateWidgetData = useMutation(({ storage }, id: string, p: WidgetData) => {
    storage.get('widgets')?.get(id)?.get('data').update(p);
  }, []);
  const removeWidget = useMutation(({ storage }, id: string) => {
    storage.get('widgets')?.delete(id);
  }, []);
  const gesture = (on: boolean) => (on ? history.pause() : history.resume());
  const addWidget = (type: string) => {
    const def = WIDGETS[type];
    const r = ref.current!.getBoundingClientRect();
    const x = (r.width / 2 - cam.x) / cam.s - def.defaultSize.w / 2;
    const y = (r.height / 2 - cam.y) / cam.s - def.defaultSize.h / 2;
    const id = nanoid();
    insertWidget(
      id,
      {
        widgetType: type,
        x,
        y,
        w: def.defaultSize.w,
        h: def.defaultSize.h,
        title: def.name,
        isCollapsed: false,
        isLocked: false,
        createdBy: user.name,
        z: Date.now(),
      },
      def.initialData(),
    );
    setFocusedWidget(id);
    setTool('cursor');
  };
  const duplicateWidget = (w: WSnap) => {
    const id = nanoid();
    insertWidget(
      id,
      {
        widgetType: w.widgetType,
        x: w.x + 30,
        y: w.y + 30,
        w: w.w,
        h: w.h,
        title: w.title,
        isCollapsed: false,
        isLocked: false,
        createdBy: user.name,
        z: Date.now(),
      },
      { ...w.data },
    );
  };

  const insert = useMutation(({ storage }, id: string, l: Layer) => {
    storage.get('layers').set(id, new LiveObject(l));
  }, []);
  const patch = useMutation(({ storage }, id: string, p: Partial<Layer>) => {
    storage.get('layers').get(id)?.update(p);
  }, []);
  const remove = useMutation(({ storage, setMyPresence }, ids: string[]) => {
    const m = storage.get('layers');
    ids.forEach((i) => m.delete(i));
    setMyPresence({ selection: [] });
  }, []);

  const saveTitle = () => {
    const t = title.trim();
    if (!t) return setTitle(board.title);
    if (t !== board.title)
      startT(async () => {
        setTitleSaved(false);
        try {
          await renameBoard(board.id, t);
          setTitleSaved(true);
        } catch {
          setTitle(board.title);
          setTitleSaved(true);
          toast.error("Couldn't save the board title. Please try again.");
        }
      });
  };
  const share = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard access is unavailable');
      await navigator.clipboard.writeText(`${location.origin}/join/${inviteCode}?board=${board.id}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      toast.error("Couldn't copy the board link. Check your browser's clipboard permissions and try again.");
    }
  };
  const pick = (t: IconName) => {
    if (t === 'music') setPlayer((p) => !p);
    setTool(t);
  };

  const world = (e: { clientX: number; clientY: number }) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - cam.x) / cam.s, y: (e.clientY - r.top - cam.y) / cam.s };
  };
  const hit = (p: { x: number; y: number }) => {
    const pad = 6 / cam.s;
    return [...itemsRef.current]
      .reverse()
      .find(
        (l) =>
          p.x >= l.x - pad && p.x <= l.x + l.w + pad && p.y >= l.y - pad && p.y <= l.y + l.h + pad,
      );
  };
  const base = (
    kind: Layer['kind'],
    x: number,
    y: number,
    w: number,
    h: number,
    extra: Partial<Layer> = {},
  ): Layer => ({
    kind,
    x,
    y,
    w,
    h,
    fill: 'none',
    createdAt: Date.now(),
    ...extra,
  });
  const zoomAt = (px: number, py: number, f: number) =>
    setCam((c) => {
      const s = Math.min(4, Math.max(0.25, c.s * f));
      return { s, x: px - ((px - c.x) * s) / c.s, y: py - ((py - c.y) * s) / c.s };
    });
  const zoomBy = (f: number) => {
    const r = ref.current!.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, f);
  };
  const fit = () => {
    const ls = itemsRef.current;
    const r = ref.current!.getBoundingClientRect();
    if (!ls.length) return setCam({ x: 0, y: 0, s: 1 });
    const x0 = Math.min(...ls.map((l) => l.x)),
      y0 = Math.min(...ls.map((l) => l.y));
    const x1 = Math.max(...ls.map((l) => l.x + l.w)),
      y1 = Math.max(...ls.map((l) => l.y + l.h));
    const s = Math.min(
      2,
      Math.max(0.25, Math.min(r.width / (x1 - x0 + 160), r.height / (y1 - y0 + 160))),
    );
    setCam({ s, x: r.width / 2 - ((x0 + x1) / 2) * s, y: r.height / 2 - ((y0 + y1) / 2) * s });
  };

  // wheel: pan, ctrl/cmd+wheel (and trackpad pinch) zoom — native listener so preventDefault works
  useEffect(() => {
    const el = ref.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.01));
      } else setCam((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const keys: Record<string, IconName> = {
      v: 'cursor',
      p: 'pen',
      t: 'text',
      r: 'shapes',
      n: 'link',
      e: 'eraser',
    };
    const dn = (e: KeyboardEvent) => {
      if (isFromWidgetBody(e)) return;
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        space.current = true;
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? history.redo() : history.undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (mySelRef.current.length) remove(mySelRef.current);
      } else if (!e.ctrlKey && !e.metaKey && keys[e.key.toLowerCase()])
        setTool(keys[e.key.toLowerCase()]);
    };
    const upk = (e: KeyboardEvent) => {
      if (e.code === 'Space') space.current = false;
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', upk);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', upk);
    };
  }, [history, remove]);
  useEffect(() => {
    const { documentElement: h, body: b } = document;
    const prev = [h.style.overflow, b.style.overflow];
    h.style.overflow = b.style.overflow = 'hidden';
    return () => {
      h.style.overflow = prev[0];
      b.style.overflow = prev[1];
    };
  }, []);
  const mySelRef = useRef<string[]>([]);
  mySelRef.current = mySel as string[];

  const down = (e: React.PointerEvent) => {
    if (e.button === 2) return;
    if (isFromWidgetBody(e.nativeEvent)) return;
    ref.current!.setPointerCapture(e.pointerId);
    const p = world(e);
    if (space.current || e.button === 1) {
      g.current = { t: 'pan', sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y };
      return;
    }
    if (tool === 'cursor') {
      const sel = (mySel as string[])[0];
      const cur = sel ? itemsRef.current.find((l) => l.id === sel) : undefined;
      if (
        cur &&
        cur.kind !== 'path' &&
        cur.kind !== 'text' &&
        Math.abs(p.x - (cur.x + cur.w)) < 12 / cam.s &&
        Math.abs(p.y - (cur.y + cur.h)) < 12 / cam.s
      ) {
        history.pause();
        g.current = { t: 'resize', id: cur.id, ox: cur.x, oy: cur.y };
        return;
      }
      const h = hit(p);
      if (h) {
        update({ selection: [h.id] });
        history.pause();
        g.current = { t: 'move', id: h.id, px: p.x, py: p.y, ox: h.x, oy: h.y };
      } else {
        update({ selection: [] });
        g.current = { t: 'pan', sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y };
      }
    } else if (tool === 'pen') {
      history.pause();
      g.current = { t: 'draw', pts: [p.x, p.y] };
      setPen([p.x, p.y]);
      update({ pen: [p.x, p.y] });
    } else if (tool === 'shapes') {
      g.current = { t: 'shape', x: p.x, y: p.y };
    } else if (tool === 'text' || tool === 'link') {
      g.current = { t: 'place', x: p.x, y: p.y };
    } else if (tool === 'eraser') {
      g.current = { t: 'erase' };
      const h = hit(p);
      if (h) remove([h.id]);
    }
  };

  const move = (e: React.PointerEvent) => {
    const p = world(e);
    update({ cursor: p });
    const s = g.current;
    if (!s) return;
    if (s.t === 'pan')
      setCam((c) => ({ ...c, x: s.cx + e.clientX - s.sx, y: s.cy + e.clientY - s.sy }));
    else if (s.t === 'move') patch(s.id, { x: s.ox + p.x - s.px, y: s.oy + p.y - s.py });
    else if (s.t === 'resize')
      patch(s.id, { w: Math.max(30, p.x - s.ox), h: Math.max(30, p.y - s.oy) });
    else if (s.t === 'draw') {
      s.pts.push(p.x, p.y);
      const c = [...s.pts];
      setPen(c);
      update({ pen: c });
    } else if (s.t === 'shape')
      setDraft(
        base(
          shape,
          Math.min(s.x, p.x),
          Math.min(s.y, p.y),
          Math.abs(p.x - s.x),
          Math.abs(p.y - s.y),
        ),
      );
    else if (s.t === 'erase') {
      const h = hit(p);
      if (h) remove([h.id]);
    }
  };

  const up = () => {
    const s = g.current;
    g.current = null;
    if (!s) return;
    if (s.t === 'draw') {
      if (s.pts.length >= 4) {
        const xs = s.pts.filter((_, i) => i % 2 === 0),
          ys = s.pts.filter((_, i) => i % 2 === 1);
        const x0 = Math.min(...xs),
          y0 = Math.min(...ys);
        insert(
          nanoid(),
          base('path', x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0, {
            fill: INK,
            points: s.pts.map((v, i) => v - (i % 2 ? y0 : x0)),
          }),
        );
      }
      setPen(null);
      update({ pen: null });
      history.resume();
    } else if (s.t === 'shape') {
      const d = draft ?? base(shape, s.x - 70, s.y - 50, 140, 100);
      const l = d.w < 6 && d.h < 6 ? base(shape, s.x - 70, s.y - 50, 140, 100) : d;
      const id = nanoid();
      insert(id, l);
      update({ selection: [id] });
      setDraft(null);
      setTool('cursor');
    } else if (s.t === 'place') {
      const id = nanoid();
      if (tool === 'text') insert(id, base('text', s.x, s.y, 120, 30, { text: '', fill: INK }));
      else insert(id, base('note', s.x - 90, s.y - 70, 180, 140, { text: '', fill: '#f8e08a' }));
      update({ selection: [id] });
      setEditing(id);
      setTool('cursor');
    } else if (s.t === 'move' || s.t === 'resize') history.resume();
  };

  const edit = (e: React.MouseEvent) => {
    const h = hit(world(e));
    if (h && h.kind !== 'path') {
      update({ selection: [h.id] });
      setEditing(h.id);
    }
  };

  const outline = (id: string, color: string, key: string, mine = false) => {
    const l = itemsRef.current.find((i) => i.id === id);
    if (!l) return null;
    const hs = 10 / cam.s;
    return (
      <g key={key}>
        <rect
          x={l.x - 4}
          y={l.y - 4}
          width={l.w + 8}
          height={l.h + 8}
          fill="none"
          stroke={color}
          strokeWidth={2 / cam.s}
          strokeDasharray={mine ? `${6 / cam.s}` : undefined}
          rx={6}
        />
        {mine && l.kind !== 'path' && l.kind !== 'text' && (
          <rect
            x={l.x + l.w - hs / 2}
            y={l.y + l.h - hs / 2}
            width={hs}
            height={hs}
            fill="#fff"
            stroke={color}
            strokeWidth={2 / cam.s}
          />
        )}
      </g>
    );
  };

  return (
    <div className={`whiteboard tool-${tool}`}>
      <header className="board-topbar">
        <button
          className="board-home"
          onClick={() => { setGoingHome(true); router.push('/dashboard'); }}
          disabled={goingHome}
          title="Back to dashboard"
        >
          <span className="logo-mark">
            <span />
          </span>
          {goingHome ? (
            <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          ) : (
            <Icon name="chevron" size={15} />
          )}
        </button>
        <div className="board-title">
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleSaved(false); }}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          <span>{titleSaved ? 'Saved just now' : 'Saving…'}</span>
        </div>
        <div className="board-presence">
          <div className="mini-avatars">
            {people.map((p, i) => (
              <i className={`av a${(i % 4) + 1}`} key={i} title={p}>
                {p[0]?.toUpperCase()}
              </i>
            ))}
          </div>
          <span>{people.length} here</span>
          <button className={shared ? 'shared' : ''} onClick={share}>
            <Icon name={shared ? 'check' : 'share'} size={17} />
            {shared ? 'Link copied' : 'Share'}
          </button>
        </div>
      </header>
      <aside className="tool-rail">
        {tools.map((t) => (
          <button
            key={t.name}
            className={tool === t.name ? 'active' : ''}
            onClick={() => pick(t.name)}
            data-tip={t.label}
          >
            <Icon name={t.name} size={21} />
          </button>
        ))}
        <button onClick={() => addWidget('counter')} data-tip="Add counter">
          <Icon name="plus" size={21} />
        </button>
        <button onClick={() => addWidget('youtube')} data-tip="Add YouTube">
          <Icon name="video" size={21} />
        </button>
        <button onClick={() => addWidget('call')} data-tip="Add video call">
          <Video size={21} aria-hidden="true" />
        </button>
        <button onClick={() => addWidget('notes')} data-tip="Add notes">
          <NotebookPen size={21} aria-hidden="true" />
        </button>
        <AddPdfButton
          canvasRef={ref}
          camera={{ x: cam.x, y: cam.y, scale: cam.s }}
          boardId={board.id}
          userId={user.id}
        />
        <span className="rail-divider" />
        <button
          onClick={() => pick('eraser')}
          className={tool === 'eraser' ? 'active' : ''}
          data-tip="Eraser"
        >
          <Icon name="eraser" size={21} />
        </button>
      </aside>
      <main
        className="canvas"
        ref={ref}
        style={{ touchAction: 'none', overflow: 'hidden' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={() => update({ cursor: null })}
        onDoubleClick={edit}
      >
        {isPdfOver && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              padding: '0.5rem 0.9rem',
              borderRadius: 999,
              background: 'rgba(36, 35, 31, 0.86)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.2,
              pointerEvents: 'none',
            }}
          >
            Drop a PDF to add it
          </div>
        )}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <g transform={`translate(${cam.x} ${cam.y}) scale(${cam.s})`}>
            {items.map((l) => renderLayer(l, editing))}
            {draft && renderLayer({ ...draft, id: 'draft' })}
            {pen && <path d={pathD(pen)} fill="#24231f" />}
            {others.map(
              (o) =>
                o.presence.pen && (
                  <path key={o.connectionId} d={pathD(o.presence.pen)} fill={o.info.color} />
                ),
            )}
            {others.flatMap((o) =>
              o.presence.selection.map((id) => outline(id, o.info.color, `${o.connectionId}${id}`)),
            )}
            {mySel.map((id) => outline(id, me.color, id, true))}
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            transformOrigin: '0 0',
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`,
            pointerEvents: 'none',
          }}
        >
          {widgets.map((w) => {
            const def = WIDGETS[w.widgetType];
            if (!def) return null;
            return (
              <WidgetShell
                key={w.id}
                w={w}
                def={def}
                scale={cam.s}
                color={me.color}
                focused={focusedWidget === w.id}
                onFocus={() => setFocusedWidget(w.id)}
                gesture={gesture}
                patch={(p) => patchWidget(w.id, p)}
                updateData={(p) => updateWidgetData(w.id, p)}
                duplicate={() => duplicateWidget(w)}
                remove={() => removeWidget(w.id)}
              />
            );
          })}
        </div>
        {others.map(
          (o) =>
            o.presence.cursor && (
              <div
                key={o.connectionId}
                className="cursor-tag"
                style={{
                  position: 'absolute',
                  left: o.presence.cursor.x * cam.s + cam.x,
                  top: o.presence.cursor.y * cam.s + cam.y,
                  right: 'auto',
                  bottom: 'auto',
                  transform: 'none',
                  background: o.info.color,
                  pointerEvents: 'none',
                }}
              >
                <Icon name="cursor" size={13} /> {o.info.name.split(' ')[0]}
              </div>
            ),
        )}
        {editing &&
          (() => {
            const l = items.find((i) => i.id === editing);
            if (!l) return null;
            const k = cam.s;
            const isShape = l.kind !== 'text' && l.kind !== 'note';
            const fs = (l.kind === 'text' ? 24 : l.kind === 'note' ? 17 : 18) * k;
            const lh = fs * (l.kind === 'text' ? 1.25 : 1.3);
            const n = lineCount(l.text);
            let left = l.x * k + cam.x,
              top = l.y * k + cam.y;
            let width = (l.kind === 'text' ? Math.max(l.w, 160) : l.w) * k;
            let height = lh * n + 2;
            if (l.kind === 'note') {
              left += 14 * k;
              top += 14 * k;
              width -= 28 * k;
              height = (l.h - 28) * k;
            }
            if (isShape) {
              left += l.w * k * 0.12;
              width = l.w * k * 0.76;
              top += (l.h * k - lh * n) / 2;
            }
            return (
              <textarea
                autoFocus
                value={l.text ?? ''}
                onFocus={() => history.pause()}
                onBlur={() => {
                  history.resume();
                  setEditing(null);
                  if (l.kind === 'text' && !(l.text ?? '').trim()) remove([l.id]);
                }}
                onChange={(e) => {
                  const v = e.target.value;
                  patch(
                    l.id,
                    l.kind === 'text'
                      ? {
                          text: v,
                          w: Math.max(...v.split('\n').map((s) => s.length), 1) * 13,
                          h: 30 * lineCount(v),
                        }
                      : { text: v },
                  );
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') e.currentTarget.blur();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  fontSize: fs,
                  lineHeight: `${lh}px`,
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 500,
                  color: INK,
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  resize: 'none',
                  overflow: 'hidden',
                  padding: 0,
                  margin: 0,
                  textAlign: isShape ? 'center' : 'left',
                  zIndex: 5,
                }}
              />
            );
          })()}
        {tool === 'shapes' && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: 92,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 8,
              background: 'var(--paper)',
              border: '1.5px solid var(--ink)',
              borderRadius: 16,
              boxShadow: '0 8px 20px rgba(0,0,0,.12)',
            }}
          >
            {(['rect', 'triangle', 'ellipse', 'cylinder'] as const).map((s) => (
              <button
                key={s}
                title={{ rect: 'Rectangle', triangle: 'Triangle', ellipse: 'Ellipse', cylinder: 'Cylinder' }[s]}
                onClick={() => setShape(s)}
                style={{
                  width: 40,
                  height: 40,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 10,
                  border: 0,
                  background: shape === s ? 'var(--lav)' : 'transparent',
                  color: BLUE,
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  {s === 'rect' && <rect x="4" y="6" width="16" height="12" rx="2" />}
                  {s === 'triangle' && <path d="M12 4 21 19H3Z" />}
                  {s === 'ellipse' && <ellipse cx="12" cy="12" rx="9" ry="6" />}
                  {s === 'cylinder' && (
                    <>
                      <ellipse cx="12" cy="6" rx="7" ry="3" />
                      <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
                    </>
                  )}
                </svg>
              </button>
            ))}
          </div>
        )}
        {tool === 'image' && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: 92,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 8,
              background: 'var(--paper)',
              border: '1.5px solid var(--ink)',
              borderRadius: 16,
              boxShadow: '0 8px 20px rgba(0,0,0,.12)',
            }}
          >
            {Object.values(WIDGETS).map((d) => (
              <button
                key={d.type}
                onClick={() => addWidget(d.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  border: 0,
                  borderRadius: 10,
                  background: 'transparent',
                  cursor: 'pointer',
                  font: '500 14px DM Sans, sans-serif',
                }}
              >
                <span style={{ fontSize: 18 }}>{d.icon}</span> {d.name}
              </button>
            ))}
          </div>
        )}
        {player && (
          <div className="retro-player">
            <div className="player-head">
              <span>FOCUS TAPE 01</span>
              <button onClick={() => setPlayer(false)}>×</button>
            </div>
            <div className="cassette-art">
              <div className="tape-reel">
                <i />
                <i />
              </div>
              <span>
                deep focus
                <br />
                SIDE A
              </span>
            </div>
            <div className="track-info">
              <div>
                <b>library after dark</b>
                <small>lofi study club</small>
              </div>
              <span>{playing ? '02:31' : '00:00'}</span>
            </div>
            <div className="track-line">
              <i style={{ width: playing ? '54%' : '4%' }} />
            </div>
            <div className="player-controls">
              <button disabled title="Audio playback is not available yet" aria-label="Previous track">↶</button>
              <button
                className="main-play"
                disabled
                title="Audio playback is not available yet"
                aria-label="Audio playback unavailable"
                onClick={() => setPlaying(!playing)}
              >
                {playing ? 'Ⅱ' : <Icon name="play" size={19} />}
              </button>
              <button disabled title="Audio playback is not available yet" aria-label="Next track">↷</button>
              <div className={`equalizer ${playing ? 'moving' : ''}`}>
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        )}
      </main>
      <div className="zoom-controls">
        <button onClick={() => zoomBy(1 / 1.2)}>−</button>
        <span>{Math.round(cam.s * 100)}%</span>
        <button onClick={() => zoomBy(1.2)}>+</button>
        <button onClick={fit}>
          <Icon name="zoom" size={17} />
        </button>
      </div>
      <div className="canvas-actions">
        <button onClick={() => history.undo()} disabled={!canUndo}>
          <Icon name="undo" size={18} />
        </button>
        <button className="redo" onClick={() => history.redo()} disabled={!canRedo}>
          <Icon name="undo" size={18} />
        </button>
      </div>
      <div className="board-hint">
        <span>TIP</span> {HINTS[tool] ?? HINTS.cursor}
      </div>
    </div>
  );
}
