import { colorTable } from "./colormaps";
export const COLORS = ["#0072BD", "#D95319", "#EDB120", "#7E2F8E", "#77AC30", "#4DBEEE", "#A2142F"];
export type Point = [number, number];
export type MatlabModel = {
  parameters: { key: string; value: number; comment: string }[];
  setup: string;
  series: { x: string; y: string }[];
  annotations?: string[];
  annotationLabels?: string[];
  bands?: { from: string; to: string }[];
  xlim?: string;
  ylim?: string;
  rightLim?: string;
  title?: string;
  legendLocation?: "northeast" | "southeast";
};
export type Series = {
  kind?: "line" | "bar";
  name: string;
  points: Point[];
  color?: string;
  style?: "-" | "--" | ":" | "-." | "none";
  marker?: "o" | "s" | "^" | "x";
  axis?: "left" | "right";
  legend?: boolean;
};
export type Field = {
  x: number[];
  y: number[];
  z: number[][];
  map?: "parula" | "RdBu";
  label: string;
  limits?: [number, number];
};
export type Panel = {
  matlabModel?: MatlabModel;
  integerX?: boolean;
  title: string;
  xlabel: string;
  ylabel: string;
  rightLabel?: string;
  xlim: [number, number];
  ylim: [number, number];
  rightLim?: [number, number];
  xscale?: "linear" | "log";
  xtickLabels?: { value: number; label: string }[];
  yscale?: "linear" | "log";
  kind?: "cartesian" | "polar";
  series?: Series[];
  field?: Field;
  legend?: boolean;
  annotationHeader?: boolean;
  annotations?: {
    axis: "x" | "y";
    value: number;
    label: string;
    labelY?: number;
    labelPosition?: "below-left";
  }[];
  bands?: { from: number; to: number; label: string }[];
};
export const sample = (fn: (x: number) => number, min: number, max: number, n = 401): Point[] =>
  Array.from({ length: n }, (_, i) => {
    const x = min + ((max - min) * i) / (n - 1);
    return [x, fn(x)];
  });

export const PARULA = colorTable().map((rgb) => `rgb(${rgb.join(",")})`);
export function fieldColor(value: number, limits: [number, number], map = "parula") {
  const t = Math.max(0, Math.min(1, (value - limits[0]) / (limits[1] - limits[0] || 1)));
  return `rgb(${colorTable(map)[Math.round(t * 63)].join(",")})`;
}
export function fieldLimits(f: Field): [number, number] {
  return f.limits ?? [Math.min(...f.z.flat()), Math.max(...f.z.flat())];
}
