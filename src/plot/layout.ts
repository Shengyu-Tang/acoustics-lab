import type { Panel } from "./types";
export const textWidth = (text: string) =>
  Array.from(text).reduce((w, c) => w + (/[^\u0000-\u00ff]/.test(c) ? 11 : 6.5), 0);

/** Wrap prose at screen-pixel widths, retaining readable font sizes. */
export function textLines(text: string, width: number): string[] {
  const lines: string[] = [""];
  const tokens = text.match(/[-+]?\d+(?:\.\d+)?×10[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]+|[_^]\{[^}]+\}|[\s\S]/g) ?? [];
  for (const c of tokens) {
    if (lines.at(-1) && textWidth(lines.at(-1)! + c) > width) lines.push("");
    lines[lines.length - 1] += c;
  }
  return lines;
}

/** Place vertical-line labels to their right, and band labels at their center, inside the axes. */
export function labelLanes(panel: Panel, left: number, width: number, xs: (n: number) => number) {
  if (panel.annotationHeader) {
    // A legend-style readout decouples close frequency labels from their lines.
    const texts = [
      ...(panel.annotations ?? [])
        .filter((a) => a.axis === "x")
        .sort((a, b) => a.value - b.value)
        .map((a) => a.label),
      ...(panel.bands ?? []).map((b) => b.label),
    ];
    let x = left + 8,
      lane = 0;
    const bands = (panel.bands ?? []).map((b) => ({
      label: b.label,
      from: left + xs(b.from) * width,
      to: left + xs(b.to) * width,
    }));
    return texts.map((text) => {
      const size = textWidth(text);
      const band = bands.find((b) => b.label === text);
      if (band)
        return {
          text,
          x: Math.max(
            left + 4,
            Math.min(left + width - size - 4, (band.from + band.to - size) / 2),
          ),
          lane: lane + 1,
        };
      const skipBands = () => {
        for (const b of bands) if (x < b.to + 8 && x + size > b.from - 8) x = b.to + 8;
      };
      skipBands();
      if (x + size > left + width - 8 && x > left + 8) {
        x = left + 8;
        lane++;
        skipBands();
      }
      const label = { text, x, lane };
      x += size + 16;
      return label;
    });
  }
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
  const xsForLabels = (v: number) => (xy(v, panel.ylim[0], false)[0] - left) / width;
  const labelsForLegend = labelLanes(panel, left, width, xsForLabels);
  const afterLabels = labelsForLegend.length
    ? (Math.max(...labelsForLegend.map((l) => l.lane)) + 1) * 17 + 4
    : 1;
  const candidates = [
    [left + width - boxW - 7, top + 7],
    [left + 7, top + 7],
    [left + width - boxW - 7, top + height - boxH - 7],
    [left + 7, top + height - boxH - 7],
    [left + width - boxW - 7, top + (height - boxH) / 2],
    [left + 7, top + (height - boxH) / 2],
    [left + width - boxW - 7, top + afterLabels],
    [left + 7, top + afterLabels],
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
      const ay =
        xy(panel.xlim[1], a.value, false)[1] + (a.labelPosition === "below-left" ? 5 : -18);
      const ax =
        a.labelPosition === "below-left" ? left + 5 : left + width - textWidth(a.label) - 5;
      if (x < ax + textWidth(a.label) && x + boxW > ax && y < ay + 14 && y + boxH > ay)
        score += width * height;
    }
    return score;
  });
  return candidates[scores.indexOf(Math.min(...scores))];
}
