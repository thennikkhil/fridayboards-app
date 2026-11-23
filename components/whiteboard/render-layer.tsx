import getStroke from 'perfect-freehand';
import type { Layer } from '@/lib/liveblocks-types';

export type Item = Layer & { id: string };

export const INK = '#24231f';

export function pathD(flat: number[]) {
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

export const BLUE = '#2f7bff'; // neon blue border
export const glow = { filter: 'drop-shadow(0 0 5px rgba(47,123,255,.7))' };
export const lineCount = (t = '') => t.split('\n').length;

export function renderLayer(l: Item, hide: string | null = null) {
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
