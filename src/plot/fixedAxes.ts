import { sample } from "./types";
import type { Panel } from "./types";
import axes from "./fixedAxes.json";
type Limits = { xlim: [number, number]; ylim: [number, number]; rightLim?: [number, number] };
/** Committed slider-domain envelopes; independent of the current data and time.
 * Geometry panels retain their physical maximum-length limits. MATLAB uses the
 * identical contract even after its parameter block is edited. */
export function fixedFigureAxes(id: string, panels: Panel[]): Panel[] {
  const limits = (axes as unknown as Record<string, Limits[]>)[id];
  if (!limits) return panels;
  if (limits.length !== panels.length) throw new Error(`Fixed-axis panel count: ${id}`);
  return panels.map((original, i) => {
    const p = { ...original };
    const timeProfile = id.startsWith("1.") && p.xlabel.startsWith("时间");
    if (timeProfile) {
      p.observationWindow = true;
      p.series = p.series?.map((s) =>
        s.evaluate ? { ...s, points: sample(s.evaluate!, ...limits[i].xlim, 1601) } : s,
      );
      // Curves span the fixed observation window; marker times remain physical.
      if (p.matlabModel) {
        p.matlabModel = {
          ...p.matlabModel,
          setup: p.matlabModel.setup + `;finish=${limits[i].xlim[1]};`,
          series: p.matlabModel.series.map((s, j) => ({
            ...s,
            x: p.series?.[j]?.evaluate
              ? s.x.replace(/^linspace\(0,finish,.*\)$/, "linspace(0,finish,1601)")
              : s.x,
          })),
        };
      }
    }
    const unit = p.ylabel.match(/\(([^()]*)\)\s*$/)?.[1] ?? "";
    if (
      !p.series?.some((s) => s.geometry) &&
      /^(m|s|Pa|kg|W|J|Hz)/.test(unit) &&
      !["2.2-3", "2.4-2"].includes(id)
    ) {
      const y = (p.series ?? [])
        .filter((s) => s.axis !== "right" && s.points.length > 100)
        .flatMap((s) => s.points.map((pt) => pt[1]))
        .filter(Number.isFinite);
      if (y.length)
        p.responseNote = `max |y| = ${Math.max(...y.map(Math.abs)).toPrecision(4)} ${unit}`;
    }
    return {
      ...p,
      ...limits[i],
      matlabModel: p.matlabModel
        ? {
            ...p.matlabModel,
            xlim: `[${limits[i].xlim.join(" ")}]`,
            ylim: `[${limits[i].ylim.join(" ")}]`,
            ...(limits[i].rightLim ? { rightLim: `[${limits[i].rightLim!.join(" ")}]` } : {}),
          }
        : undefined,
    };
  });
}
