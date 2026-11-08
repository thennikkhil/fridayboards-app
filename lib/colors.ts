export const PALETTE = ["#f36f53", "#8bb4d7", "#b9a8f0", "#5fb585", "#e0a82e", "#e07a9a"]
export function colorFor(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}
