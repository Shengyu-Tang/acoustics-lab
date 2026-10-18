import { colorTable } from "./colormaps";
export const COLORS = ["#0072BD", "#D95319", "#EDB120", "#7E2F8E", "#77AC30", "#4DBEEE", "#A2142F"];
export type Point = [number, number];
export type MatlabModel = {
  fieldLimits?: string;
  amplitudeAxes?: boolean;
  amplitudeMarkers?: boolean;
  envelopePeriod?: string;
  textLabels?: { x: string; y: string }[];
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
  legendLocation?: "northeast" | "southeast" | "northeastoutside";
  legendNames?: string[];
  field?: { x: string; y: string; z: string };
};
export type Series = {
  evaluate?: (x: number) => number;
  geometry?: { key: string; axis: "x" | "y" };
  kind?: "line" | "bar" | "barh";
  name: string;
  points: Point[];
  color?: string;
  style?: "-" | "--" | ":" | "-." | "none";
  marker?: "o" | "s" | "^" | "x";
  axis?: "left" | "right";
  legend?: boolean;
};
export type Field = {
  categories?: { value: number; label: string; color: string }[];
  x: number[];
  y: number[];
  z: number[][];
  map?: "parula" | "RdBu";
  label: string;
  limits?: [number, number];
};
export type Panel = {
  /** Fixed coordinate plane, including dimensionless impedance contours. */
  coordinateY?: boolean;
  answerKey?: string;
  equalAspect?: boolean;
  // Analytic poles have no finite envelope. The explicitly labelled display
  // window follows a current physical scale; finite curves are clipped by SVG.
  unboundedY?: boolean;
  responseNote?: string;
  observationWindow?: boolean;
  textLabels?: { x: number; y: number; text: string }[];
  matlabModel?: MatlabModel;
  integerX?: boolean;
  title: string;
  xlabel: string;
  ylabel: string;
  rightLabel?: string;
  xlim: [number, number];
  /** Retain the current physical parameter domain without expanding its limits. */
  exactXLimits?: boolean;
  ylim: [number, number];
  rightLim?: [number, number];
  xscale?: "linear" | "log";
  xtickLabels?: { value: number; label: string }[];
  ytickLabels?: { value: number; label: string }[];
  yscale?: "linear" | "log";
  kind?: "cartesian" | "polar";
  /** Angular display window in degrees; series angles remain in radians. */
  polarAngleLimits?: [number, number];
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

export function fieldFill(f: Field, value: number) {
  return (
    f.categories?.find((c) => c.value === value)?.color ?? fieldColor(value, fieldLimits(f), f.map)
  );
}
