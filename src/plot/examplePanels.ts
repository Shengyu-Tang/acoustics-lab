import type { P1Example, Values } from "../content/p1";
import { freeMotion } from "../physics/p1";
import { loadedRodRoots, rodSpeed } from "../physics/chapter2";
import { panel, line, extent, working } from "./p1Helpers";
import { attach } from "./matlabModels";
import type { Panel } from "./types";

/** Each worksheet shows the requested design or inferred quantity, not a generic lab redraw. */
export function examplePanel(id: string, p: Values, original: Panel, e: P1Example): Panel {
  let result = original,
    setup = "",
    curves: { x: string; y: string }[] = [],
    annotations: string[] = [];
  const g = (end: string, n = 1601) => `linspace(0,${end},${n})`;
  const c = (x: string, y: string) => ({ x, y });
  const w = Math.sqrt(p.D / p.M),
    T = (2 * Math.PI) / w;
  const common = "w0=sqrt(D/M); T0=2*pi/w0;";
  switch (id) {
    case "1.1.1": {
      const A = Math.hypot(p.x0, p.v0 / w),
        finish = extent(2 * T);
      result = {
        ...panel(
          "本题释放响应、最大行程与一个周期",
          "时间 t (s)",
          "位移 x (m)",
          [0, finish],
          [-1.3 * A, 2.1 * A],
          [
            line("本题 x(t)", (t) => freeMotion(p, t), finish),
            line("最大正行程", () => A, finish, "--"),
            line("最大负行程", () => -A, finish, "--"),
          ],
        ),
        annotations: [{ axis: "x", value: T, label: `固有周期 ${T.toPrecision(4)} s` }],
      };
      setup = common + "amp=hypot(x0,v0/w0); finish=niceEnd(2*T0);";
      curves = [
        c(g("finish"), "freeResponse(x,M,D,0,x0,v0)"),
        c(g("finish"), "amp+zeros(size(x))"),
        c(g("finish"), "-amp+zeros(size(x))"),
      ];
      annotations = ["T0"];
      break;
    }
    case "1.1.2": {
      const finish = extent(2 * T),
        v = p.A * w,
        a = p.A * w * w;
      result = {
        ...panel(
          "本题速度、加速度量程（左右轴）",
          "时间 t (s)",
          "振速 v (m/s)",
          [0, finish],
          [-1.3 * v, 1.6 * v],
          [
            line("振速", (t) => -v * Math.sin(w * t), finish),
            { ...line("加速度", (t) => -a * Math.cos(w * t), finish, "--"), axis: "right" },
          ],
        ),
        rightLabel: "加速度 a (m/s²)",
        rightLim: [-1.3 * a, 1.6 * a],
        annotations: [{ axis: "y", value: v, label: `最大振速 ${v.toPrecision(4)} m/s` }],
      };
      setup = common + "finish=niceEnd(2*T0);";
      curves = [c(g("finish"), "-A*w0*sin(w0*x)"), c(g("finish"), "-A*w0^2*cos(w0*x)")];
      annotations = ["A*w0"];
      break;
    }
    case "1.1.3": {
      const d = p.zeta * w,
        s1 = (-w * w) / (d + Math.sqrt(d * d - w * w)),
        s2 = -d - Math.sqrt(d * d - w * w),
        C1 = -s2 / (s1 - s2),
        back = Math.log(C1 / 0.02) / -s1,
        finish = extent(back * 1.2);
      result = {
        ...panel(
          "按所设计力阻回位：静止释放与慢衰减包络",
          "时间 t (s)",
          "归一化位移 x/x₀ (—)",
          [0, finish],
          [0, 1.4],
          [
            line(
              "本题设计 x(t)/x₀",
              (t) => freeMotion({ ...p, Rm: 2 * p.zeta * Math.sqrt(p.M * p.D), x0: 1, v0: 0 }, t),
              finish,
            ),
            line("慢衰减包络 C₁ exp(s₁t)", (t) => C1 * Math.exp(s1 * t), finish, "--"),
          ],
        ),
        annotations: [
          { axis: "x", value: back, label: `2% 包络回位界 ${back.toPrecision(4)} s` },
          { axis: "y", value: 0.02, label: "2% 位移阈值" },
        ],
      };
      setup =
        common +
        "Rm=2*zeta*sqrt(M*D); d=zeta*w0; s1=-w0^2/(d+sqrt(d^2-w0^2)); s2=-d-sqrt(d^2-w0^2); C1=-s2/(s1-s2); back=log(C1/.02)/-s1; finish=niceEnd(1.2*back);";
      curves = [c(g("finish"), "freeResponse(x,M,D,Rm,1,0)"), c(g("finish"), "C1*exp(s1*x)")];
      annotations = ["back", ".02"];
      break;
    }
    case "1.1.4": {
      const d = w / (2 * p.Qm),
        wd = Math.sqrt(w * w - d * d),
        td = (2 * Math.PI) / wd,
        finish = extent(3 * td);
      result = {
        ...panel(
          "本题相邻同向峰的包络比与时间常数",
          "时间 t (s)",
          "振幅比 A/A₀ (—)",
          [0, finish],
          [0, 1.3],
          [
            line("振幅包络", (t) => Math.exp(-d * t), finish),
            {
              name: "相邻周期包络",
              points: [
                [0, 1],
                [td, Math.exp(-d * td)],
              ],
              marker: "o",
              style: "none",
            },
          ],
        ),
        annotations: [
          { axis: "x", value: td, label: `Td = ${td.toPrecision(4)} s` },
          {
            axis: "y",
            value: Math.exp(-d * td),
            label: `峰值比 e^{-Λ} = ${Math.exp(-d * td).toPrecision(4)}`,
          },
        ],
      };
      setup = common + "d=w0/(2*Qm); wd=sqrt(w0^2-d^2); Td=2*pi/wd; finish=niceEnd(3*Td);";
      curves = [c(g("finish"), "exp(-d*x)"), c("[0 Td]", "exp(-d*x)")];
      annotations = ["Td", "exp(-d*Td)"];
      break;
    }
    case "1.1.5":
      setup = common + "d=w0/(2*Qm); finish=niceEnd(6/d);";
      curves = [c(g("finish"), "exp(-d*x)"), c("1/d", "exp(-1)")];
      break;
    case "1.2.1": {
      const beat = (2 * Math.PI) / (Math.abs(p.ratio - 1) * w),
        finish = extent(Math.max(p.tObs * 1.4, Number.isFinite(beat) ? beat * 1.2 : T * 12));
      const env = (t: number) =>
        Math.abs(p.ratio - 1) < 1e-9
          ? (p.F0 * t) / (2 * p.M * w)
          : Math.abs(
              ((2 * p.F0) / (p.D - p.M * (p.ratio * w) ** 2)) *
                Math.sin(((p.ratio - 1) * w * t) / 2),
            );
      result = {
        ...panel(
          "本题近频拍周期与精确共振的增长量",
          "时间 t (s)",
          "位移包络 (m)",
          [0, finish],
          [0, ((p.F0 * finish) / (2 * p.M * w)) * 1.3],
          [
            line("本题近频拍包络", env, finish),
            line("精确共振包络", (t) => (p.F0 * t) / (2 * p.M * w), finish, "--"),
            {
              name: "给定时刻共振包络",
              points: [[p.tObs, (p.F0 * p.tObs) / (2 * p.M * w)]],
              marker: "o",
              style: "none",
            },
          ],
        ),
        annotations: Number.isFinite(beat)
          ? [{ axis: "x", value: beat, label: `拍周期 ${beat.toPrecision(4)} s` }]
          : [],
      };
      setup =
        common +
        "if abs(ratio-1)<1e-9,beat=12*T0;else,beat=2*pi/(abs(ratio-1)*w0);end; finish=niceEnd(max(1.4*tObs,1.2*beat));";
      curves = [
        c(g("finish"), "beatEnvelope(x,M,D,F0,ratio)"),
        c(g("finish"), "F0*x/(2*M*w0)"),
        c("tObs", "F0*x/(2*M*w0)"),
      ];
      annotations = ["beat"];
      break;
    }
    case "1.2.2":
      setup = common + "Rm=sqrt(M*D)/Qm; d=Rm/(2*M); finish=niceEnd(7/d);";
      curves = [
        c(g("finish"), "forced(x,M,D,Rm,F0,ratio,x0,v0,3)"),
        c(g("finish"), "forced(x,M,D,Rm,F0,ratio,x0,v0,1)"),
        c("5/d", "forced(x,M,D,Rm,F0,ratio,x0,v0,3)"),
      ];
      result = {
        ...original,
        annotations: [{ axis: "x", value: 5 / (w / (2 * p.Qm)), label: "5τ：校核稳态工作点" }],
      };
      annotations = ["5/d"];
      break;
    case "1.2.3": {
      const d = w / (2 * p.Qm),
        on = p.pulseCycles * T,
        t95 = Math.log(20) / d,
        finish = extent(Math.max(on, t95) * 1.3);
      result = {
        ...panel(
          "本题脉宽是否足以建立 95% 振幅",
          "时间 t (s)",
          "建立比例 A/A稳态 (—)",
          [0, finish],
          [0, 1.3],
          [
            line("建立包络（弱阻尼近似）", (t) => 1 - Math.exp(-d * t), finish),
            {
              name: "本题脉冲末",
              points: [[on, 1 - Math.exp(-d * on)]],
              marker: "o",
              style: "none",
            },
          ],
        ),
        annotations: [
          { axis: "x", value: t95, label: `95% 建立时间 ${t95.toPrecision(4)} s` },
          { axis: "x", value: on, label: `脉冲宽度 ${on.toPrecision(4)} s` },
          { axis: "y", value: 0.95, label: "95% 要求" },
        ],
      };
      setup =
        common + "d=w0/(2*Qm); on=pulseCycles*T0; t95=log(20)/d; finish=niceEnd(1.3*max(on,t95));";
      curves = [c(g("finish"), "1-exp(-d*x)"), c("on", "1-exp(-d*x)")];
      annotations = ["t95", "on", ".95"];
      break;
    }
    case "2.1":
      setup = "finish=niceEnd(2*T);";
      curves = [c(g("finish"), "sqrt(x/mu)"), c("T", "sqrt(x/mu)")];
      result = {
        ...original,
        annotations: [
          {
            axis: "x",
            value: p.T,
            label: `单程时间 L/c = ${(p.L / Math.sqrt(p.T / p.mu)).toPrecision(4)} s`,
          },
        ],
      };
      annotations = ["T"];
      break;
    case "2.2":
      setup = "targetT=mu*(2*L*target)^2; finish=niceEnd(1.5*max(targetT,T));";
      curves = [c(g("finish"), "sqrt(x/mu)/(2*L)"), c("targetT", "target")];
      result = {
        ...original,
        annotations: [
          { axis: "y", value: p.target, label: "目标基频" },
          { axis: "x", value: p.T, label: "当前张力" },
        ],
      };
      annotations = ["target", "T"];
      break;
    case "2.3": {
      const speed = rodSpeed(p.E * 1e9, p.rho),
        finish = extent(p.tipMass * 2),
        calc = (mass: number) =>
          (loadedRodRoots(p.rho, p.S, p.L, Math.max(1e-9, mass))[0] * speed) / (2 * Math.PI * p.L);
      result = working(
        panel(
          `本题带质量钢棒：c = ${speed.toPrecision(4)} m/s`,
          "端点质量 M (kg)",
          "第一阶频率 f₁ (Hz)",
          [0, finish],
          [0, calc(0) * 1.4],
          [line("首根 q₁ 对应的第一阶频率", calc, finish)],
        ),
        p.tipMass,
        calc(p.tipMass),
      );
      setup = "speed=sqrt(E*1e9/rho); finish=niceEnd(2*tipMass);";
      curves = [
        c(g("finish"), "loadedFrequency(x,rho,S,L,speed)"),
        c("tipMass", "loadedFrequency(x,rho,S,L,speed)"),
      ];
      break;
    }
    case "2.4":
      setup = "finish=niceEnd(1.5*measured);";
      curves = [c(g("finish"), "4*rho*L^2*x.^2/1e9"), c("measured", "4*rho*L^2*x.^2/1e9")];
      break;
    default:
      throw new Error(`Missing example model ${id}`);
  }
  // Exact worksheet answers are computed independently in MATLAB for the two-set check.
  setup += e.asks.map((a) => `${a.key}=${a.matlab};`).join("\n");
  setup += `worksheet_answers=[${e.asks.map((a) => a.key).join(" ")}];`;
  const modeled = attach([result], p, e.given, setup, [curves], [annotations])[0];
  if (id === "1.1.1") modeled.matlabModel!.ylim = "[-1.3 2.2]*max(amp,1e-9)";
  if (id === "2.1")
    modeled.matlabModel!.annotationLabels = ["sprintf('单程时间 L/c = %.4g s',L/sqrt(T/mu))"];
  if (id === "2.3") modeled.matlabModel!.title = "sprintf('本题带质量钢棒：c = %.4g m/s',speed)";
  return modeled;
}
