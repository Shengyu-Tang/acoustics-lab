import type { Panel } from "./types";
export const textWidth = (text: string) =>
  Array.from(text).reduce((w, c) => w + (/[^\u0000-\u00ff]/.test(c) ? 11 : 6.5), 0);

/** Place vertical-line labels to their right, and band labels at their center, inside the axes. */
export function labelLanes(panel: Panel, left: number, width: number, xs: (n: number) => number) {
  const labels = [
    ...(panel.bands ?? []).map((b) => ({
      text: b.label,
      anchor: left + xs((b.from + b.to) / 2) * width,
      centered: true,
    })),
    ...(panel.annotations ?? [])
      .filter((a) => a.axis === "x")
      .map((a) => ({
        text: a.label,
        anchor: left + xs(a.value) * width + 5,
        centered: false,
      })),
  ];
  const lanes: number[][] = [];
  return labels.map(({ text, anchor, centered }) => {
    const size = textWidth(text);
    const x = Math.max(
      left + 4,
      Math.min(left + width - size - 4, centered ? anchor - size / 2 : anchor),
    );
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

/** Minimize the actual curve length hidden, independent of sampling density. */
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
    [left + width - boxW - 7, top + (height - boxH) / 2],
    [left + 7, top + (height - boxH) / 2],
  ];
  const scores = candidates.map(([x, y]) => {
    let score = 0;
    for (const s of panel.series ?? []) {
      for (let i = 0; i < s.points.length; i++) {
        const a = xy(...s.points[i], s.axis === "right");
        const b = i ? xy(...s.points[i - 1], s.axis === "right") : a;
        let enter = 0,
          leave = 1;
        for (let dim = 0; dim < 2; dim++) {
          const lo = dim ? y - 3 : x - 3,
            hi = lo + (dim ? boxH : boxW) + 6;
          const delta = b[dim] - a[dim];
          if (delta === 0) {
            if (a[dim] < lo || a[dim] > hi) leave = -1;
          } else {
            const ends = [(lo - a[dim]) / delta, (hi - a[dim]) / delta].sort((a, b) => a - b);
            enter = Math.max(enter, ends[0]);
            leave = Math.min(leave, ends[1]);
          }
        }
        if (leave >= enter)
          score += (leave - enter) * Math.hypot(b[0] - a[0], b[1] - a[1]) + (s.marker ? 6 : 0);
      }
    }
    const xs = (v: number) => (xy(v, panel.ylim[0], false)[0] - left) / width;
    for (const label of labelLanes(panel, left, width, xs)) {
      const ly = top + 4 + label.lane * 17;
      if (label.x < x + boxW && label.x + textWidth(label.text) > x && ly < y + boxH && ly + 14 > y)
        score += width * height;
    }
    for (const a of panel.annotations ?? []) {
      if (a.axis !== "y") continue;
      const ay = xy(panel.xlim[1], a.value, false)[1] - 18;
      if (x + boxW > left + width - textWidth(a.label) - 5 && y < ay + 14 && y + boxH > ay)
        score += width * height;
    }
    return score;
  });
  return candidates[scores.indexOf(Math.min(...scores))];
}
