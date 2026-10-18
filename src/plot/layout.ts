import type { Panel } from "./types";
export const textWidth = (text: string) =>
  Array.from(text).reduce((w, c) => w + (/[^\u0000-\u00ff]/.test(c) ? 11 : 6.5), 0);

/** Reserve horizontal annotation lanes above the data, including band labels. */
export function labelLanes(panel: Panel, left: number, width: number, xs: (n: number) => number) {
  const labels = [
    ...(panel.annotations ?? []).map((a) => ({
      text: a.label,
      anchor: a.axis === "x" ? left + xs(a.value) * width : left,
    })),
    ...(panel.bands ?? []).map((b) => ({
      text: b.label,
      anchor: left + xs((b.from + b.to) / 2) * width,
    })),
  ];
  const lanes: number[][] = [];
  return labels.map(({ text, anchor }) => {
    const size = textWidth(text);
    const x = Math.max(left, Math.min(left + width - size, anchor - size / 2));
    // Store each lane's occupied intervals; greedy placement is deterministic.
    let lane = lanes.findIndex((ends) => {
      for (let i = 0; i < ends.length; i += 2)
        if (x < ends[i + 1] + 8 && x + size + 8 > ends[i]) return false;
      return true;
    });
    if (lane < 0) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane].push(x, x + size);
    return { text, x, lane };
  });
}

/** Pick the corner crossed by the fewest data segments (MATLAB 'best'). */
export function bestLegend(
  panel: Panel,
  left: number,
  top: number,
  width: number,
  height: number,
  boxW: number,
  boxH: number,
  xy: (x: number, y: number, right: boolean) => number[],
) {
  const candidates = [
    [left + width - boxW - 7, top + 7],
    [left + 7, top + 7],
    [left + width - boxW - 7, top + height - boxH - 7],
    [left + 7, top + height - boxH - 7],
  ];
  const scores = candidates.map(([x, y]) => {
    let score = 0;
    for (const s of panel.series ?? []) {
      for (let i = 0; i < s.points.length; i++) {
        const a = xy(...s.points[i], s.axis === "right");
        const b = i ? xy(...s.points[i - 1], s.axis === "right") : a;
        if (
          Math.max(a[0], b[0]) >= x &&
          Math.min(a[0], b[0]) <= x + boxW &&
          Math.max(a[1], b[1]) >= y &&
          Math.min(a[1], b[1]) <= y + boxH
        )
          score++;
      }
    }
    return score;
  });
  return candidates[scores.indexOf(Math.min(...scores))];
}
