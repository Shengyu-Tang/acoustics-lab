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
  return panels.map((p, i) => ({
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
  }));
}
