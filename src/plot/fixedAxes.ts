import { sample } from "./types";
import type { Panel } from "./types";
import { axisTicks } from "./ticks";
import axes from "./fixedAxes.json";
type Limits = { xlim: [number, number]; ylim: [number, number]; rightLim?: [number, number] };
export const geometryY = (p: Panel) =>
  /截面坐标|投影|示意坐标/.test(p.ylabel) || p.series?.some((s) => s.geometry?.axis === "y");
export function amplitudeLimits(values: number[], bars = false, log = false): [number, number] {
  const ys = values.filter((v) => Number.isFinite(v) && (!log || v > 0));
  if (!ys.length) return log ? [1e-6, 1] : [0, 1];
  let lo = ys.reduce((a, b) => Math.min(a, b), Infinity),
    hi = ys.reduce((a, b) => Math.max(a, b), -Infinity);
  if (log) return axisTicks([lo * 0.9, hi * 1.1], true).limits;
  if (bars) return axisTicks([0, hi > 0 ? hi * 1.08 : 1]).limits;
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.15 || 1;
    return axisTicks([lo - pad, hi + pad]).limits;
  }
  const pad = (hi - lo) * 0.08;
  return axisTicks([lo === 0 ? 0 : lo - pad, hi === 0 ? 0 : hi + pad]).limits;
}
/** Only position/time domains use the committed slider-maximum limits. */
function positionAxes(id: string, panels: Panel[]): Panel[] {
  const limits = (axes as unknown as Record<string, Limits[]>)[id];
  return panels.map((original, i) => {
    const p = { ...original },
      lim = limits?.[i];
    if (lim) p.xlim = lim.xlim;
    if (lim && geometryY(p)) p.ylim = lim.ylim;
    if (id.startsWith("1.") && p.xlabel.startsWith("时间")) {
      p.observationWindow = true;
      p.series = p.series?.map((s) =>
        s.evaluate ? { ...s, points: sample(s.evaluate!, ...p.xlim, 1601) } : s,
      );
      if (p.matlabModel)
        p.matlabModel = {
          ...p.matlabModel,
          setup: p.matlabModel.setup + `;finish=${p.xlim[1]};`,
          series: p.matlabModel.series.map((s, j) => ({
            ...s,
            x: p.series?.[j]?.evaluate
              ? s.x.replace(/^linspace\(0,finish,.*\)$/, "linspace(0,finish,1601)")
              : s.x,
          })),
        };
    }
    return p;
  });
}
export function fixedFigureAxes(
  id: string,
  panels: Panel[],
  envelope?: Panel[][],
  period?: string,
): Panel[] {
  const positioned = positionAxes(id, panels);
  const frames = envelope ?? [positioned];
  return positioned.map((p, i) => {
    const result = { ...p };
    const values = (side: string) =>
      frames.flatMap((frame) =>
        (frame[i].series ?? [])
          .filter((s) => (s.axis ?? "left") === side && s.style !== "none")
          .flatMap((s) =>
            s.points.filter(([x]) => x >= p.xlim[0] && x <= p.xlim[1]).map((pt) => pt[1]),
          ),
      );
    const bars = p.series?.some((s) => s.kind === "bar") ?? false;
    const amplitude = !geometryY(p) && !p.field && p.kind !== "polar";
    if (p.unboundedY) result.ylim = axisTicks(p.ylim).limits;
    else if (amplitude && values("left").length)
      result.ylim = amplitudeLimits(values("left"), bars, p.yscale === "log");
    if (p.rightLabel) result.rightLim = amplitudeLimits(values("right"), false, p.yscale === "log");
    if (p.matlabModel)
      result.matlabModel = {
        ...p.matlabModel,
        xlim: `[${axisTicks(p.xlim, p.xscale === "log").limits.join(" ")}]`,
        ylim: p.unboundedY
          ? p.matlabModel.ylim
          : amplitude
            ? undefined
            : `[${axisTicks(p.ylim, p.yscale === "log").limits.join(" ")}]`,
        rightLim: p.rightLabel ? undefined : p.matlabModel.rightLim,
        amplitudeAxes: amplitude && !p.unboundedY,
        envelopePeriod: amplitude && !p.unboundedY ? period : undefined,
      };
    return result;
  });
}
/** Cache only by parameters, never animation time. A complete cycle is sampled
 * at 128 phases (above Nyquist for the twelve-mode string), with 8% headroom. */
export function withFigureAxes<P extends Record<string, number>>(
  id: string,
  plot: (p: P, t: number) => Panel[],
  period?: (p: P) => number,
) {
  const cache = new Map<string, Panel[][]>();
  return (p: P, t: number): Panel[] => {
    const next = JSON.stringify(p);
    if (period && !cache.has(next)) {
      const initial = plot(p, 0);
      const needsEnvelope = initial.some((q) => !q.field && !geometryY(q) && q.kind !== "polar");
      const moving =
        needsEnvelope &&
        JSON.stringify(initial.map((q) => q.series?.map((s) => s.points))) !==
          JSON.stringify(plot(p, period(p) / 7).map((q) => q.series?.map((s) => s.points)));
      const envelope = Array.from({ length: moving ? 128 : 1 }, (_, j) =>
        positionAxes(id, j === 0 ? initial : plot(p, (period(p) * j) / 128)).map((panel) => ({
          ...panel,
          field: undefined,
          matlabModel: undefined,
          textLabels: undefined,
          series: panel.series?.map((s) => {
            const ys = s.points
              .filter(
                (pt) => Number.isFinite(pt[1]) && pt[0] >= panel.xlim[0] && pt[0] <= panel.xlim[1],
              )
              .map((pt) => pt[1]);
            return {
              name: s.name,
              style: s.style,
              axis: s.axis,
              points: [
                [panel.xlim[0], ys.reduce((a, b) => Math.min(a, b), Infinity)],
                [panel.xlim[1], ys.reduce((a, b) => Math.max(a, b), -Infinity)],
              ] as [number, number][],
            };
          }),
        })),
      );
      if (cache.size >= 32) cache.delete(cache.keys().next().value!);
      cache.set(next, envelope);
    }
    const lectureId = id.slice(0, id.lastIndexOf("-"));
    const expression = lectureId.startsWith("3.")
      ? ["3.1.4", "3.3.2"].includes(lectureId)
        ? "1"
        : "1/f"
      : lectureId.startsWith("1.")
        ? "2*pi/sqrt(D/M)"
        : ["2.3", "2.4"].includes(lectureId)
          ? "2*L/sqrt(E*1e9/rho)"
          : lectureId === "2.1"
            ? "(2+4*(boundary~=0))*L/sqrt(T/mu)"
            : "2*L/sqrt(T/mu)";
    const envelope = cache.get(next);
    return fixedFigureAxes(
      id,
      plot(p, t),
      envelope,
      envelope && envelope.length > 1 ? expression : undefined,
    );
  };
}
