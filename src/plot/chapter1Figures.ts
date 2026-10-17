import {
  characteristics,
  instantaneous,
  response,
  type Oscillator,
  instrumentSolution,
  instrument,
} from "../physics/chapter1";
import { sample, type Panel, type Series } from "./types";
export function frequencyPanels(p: Oscillator, compare: boolean): Panel[] {
  const c = characteristics(p),
    xmax = c.f0 * 2.5;
  const variants = compare
    ? [1.7, 5, 10].map((Q) => ({ name: `Qₘ = ${Q}`, p: { ...p, Rm: (c.omega0 * p.M) / Q } }))
    : [{ name: `Qₘ = ${c.Qm.toPrecision(3)}`, p }];
  const data = (key: "x" | "v" | "a" | "px" | "pv" | "pa") =>
    variants.map(({ p, name }) => ({
      name,
      points: sample(
        (f) => response(p, f)[key] * (key.startsWith("p") ? 180 / Math.PI : 1),
        0,
        xmax,
        1201,
      ),
    }));
  const amplitudes = (["x", "v", "a"] as const).map((key, i) => {
    const series = data(key),
      peak = [c.fx, c.fv, c.fa][i];
    const ymax = Math.max(...series.flatMap((s) => s.points.map((p) => p[1]))) * 1.12;
    return {
      title: ["位移幅频", "振速幅频", "加速度幅频"][i],
      xlabel: "频率 f (Hz)",
      ylabel: ["位移 xₘ (m)", "振速 vₘ (m/s)", "加速度 aₘ (m/s²)"][i],
      xlim: [0, xmax],
      ylim: [0, ymax],
      series,
      annotations: compare
        ? variants
            .filter((_, k) => i !== 1 || k === 0)
            .flatMap(({ p, name }, k) => {
              const c = characteristics(p),
                f = [c.fx, c.fv, c.fa][i];
              return f === null
                ? []
                : [
                    {
                      axis: "x",
                      value: f,
                      label: i === 1 ? "fv = f₀" : `${name}: ${f.toPrecision(3)} Hz`,
                      labelY: (k + 1) / 3,
                    },
                  ];
            })
        : peak !== null
          ? [
              {
                axis: "x",
                value: peak,
                label: `f${["x", "v", "a"][i]} = ${peak.toPrecision(4)} Hz`,
              },
            ]
          : [],
    } as Panel;
  });
  const phase = (["px", "pv", "pa"] as const).map(
    (key, i) =>
      ({
        title: ["位移相频", "振速相频", "加速度相频"][i],
        xlabel: "频率 f (Hz)",
        ylabel: "相对激励力的相位 (°)",
        xlim: [0, xmax],
        ylim: [
          [-180, 0],
          [-90, 90],
          [0, 180],
        ][i],
        series: data(key),
        legend: false,
      }) as Panel,
  );
  return [...amplitudes, ...phase];
}
export function impedancePanel(p: Oscillator): Panel {
  const c = characteristics(p),
    min = 0.15 * c.f0,
    max = 2.5 * c.f0;
  return {
    title: "机械阻抗",
    xlabel: "频率 f (Hz)",
    ylabel: "机械阻抗 (kg/s)",
    xlim: [0, max],
    ylim: [-Math.max(7 * c.omega0 * p.M, p.Rm * 1.15), Math.max(7 * c.omega0 * p.M, p.Rm * 1.15)],
    series: (["impedance", "resistance", "reactance"] as const).map((key, i) => ({
      name: ["|Zₘ|", "Rₘ", "Xₘ"][i],
      style: (["-", "--", ":"] as const)[i],
      points: sample((f) => response(p, f)[key], min, max),
    })),
    annotations: [
      { axis: "x", value: c.f0, label: "f₀：Xₘ = 0" },
      { axis: "y", value: 0, label: "零电抗" },
    ],
  };
}
export function instantaneousPanels(p: Oscillator): Panel[] {
  const c = characteristics(p),
    duration = 3 / c.f0,
    bound = ((p.F0 * p.F0) / p.Rm) * 1.1;
  return [0.8, 1, 1.2].map((r) => {
    const f = c.f0 * r,
      w = response(p, f).power;
    return {
      title: `f = ${r} f₀ (${f.toPrecision(4)} Hz)`,
      xlabel: "时间 t (s)",
      ylabel: "瞬时功率 p (W)",
      xlim: [0, duration],
      ylim: [-bound * 0.3, bound],
      series: [
        {
          name: "F(t) v(t)",
          points: sample((t) => instantaneous(p, f, t).input, 0, duration, 601),
        },
        {
          name: "平均输入功率",
          points: [
            [0, w],
            [duration, w],
          ],
          style: "--",
        },
      ],
      annotations: [{ axis: "y", value: w, label: `平均 ${w.toPrecision(3)} W` }],
    };
  });
}
export function powerPanel(p: Oscillator): Panel {
  const c = characteristics(p),
    peak = p.F0 ** 2 / (2 * p.Rm),
    xmax = Math.max(c.f0 * 2, c.f2 * 1.15);
  // Include the exact peak and half-power points among samples.
  const fs = [...sample((x) => x, 0, xmax, 1401).map((p) => p[0]), c.f0, c.f1, c.f2].sort(
    (a, b) => a - b,
  );
  return {
    title: "平均功率与半功率带宽",
    xlabel: "频率 f (Hz)",
    ylabel: "平均功率 W̄ (W)",
    xlim: [0, xmax],
    ylim: [0, peak * 1.15],
    series: [{ name: "平均机械功率", points: fs.map((f) => [f, response(p, f).power]) }],
    bands: [{ from: c.f1, to: c.f2, label: "Δf" }],
    annotations: [
      { axis: "x", value: c.f0, label: `f₀ = ${c.f0.toPrecision(4)} Hz` },
      { axis: "x", value: c.f1, label: `f₁ = ${c.f1.toPrecision(4)} Hz` },
      { axis: "x", value: c.f2, label: `f₂ = ${c.f2.toPrecision(4)} Hz` },
      { axis: "y", value: peak / 2, label: "半功率" },
    ],
  };
}
export function instrumentPanel(p: typeof instrument): Panel {
  const s = instrumentSolution(p),
    xmax = Math.max(60, s.f0 * 1.8),
    ymax =
      Math.max(
        response(p, s.fx ?? 0).x * 1000,
        response({ ...p, Rm: 400 }, characteristics({ ...p, Rm: 400 }).fx ?? 0).x * 1000,
      ) * 1.2;
  const curve = (Rm: number, name: string): Series => {
    const variant = { ...p, Rm },
      c = characteristics(variant);
    const fs = [...sample((x) => x, 0, xmax, 2001).map((p) => p[0]), c.f0, c.fx ?? 0, s.f].sort(
      (a, b) => a - b,
    );
    return { name, points: fs.map((f) => [f, response(variant, f).x * 1000]) };
  };
  return {
    title: "仪器支架：原设计与 Rₘ = 400 kg/s 方案",
    xlabel: "激励频率 f (Hz)",
    ylabel: "位移幅值 xₘ (mm)",
    xlim: [0, xmax],
    ylim: [0, ymax],
    series: [
      curve(p.Rm, `原设计 Qₘ=${s.Qm.toPrecision(3)}`),
      curve(400, `Rₘ=400 kg/s`),
      { name: "当前工作点", points: [[s.f, s.xMm]], marker: "o" },
    ],
    bands: [{ from: 25, to: 40, label: "泵转频 25–40 Hz" }],
    annotations: [
      { axis: "x", value: s.f, label: `工作点 ${s.f.toPrecision(4)} Hz` },
      { axis: "y", value: p.limit, label: `限值 ${p.limit} mm` },
    ],
  };
}
