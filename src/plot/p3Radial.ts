import { graph, curve, points, lin, log } from "../content/p3";
import type { Values } from "../content/p1";
import type { Panel } from "./types";
import {
  sphericalImpedance,
  sphericalState,
  cylindricalBessel,
  cylindricalImpedance,
  cylindricalState,
  magnitude,
  phase,
} from "../physics/chapter3b";
export function radialFigure(id: string, p: Values, t = 0): Panel[] {
  const k = (2 * Math.PI * p.f) / p.c,
    tau = 2 * Math.PI * p.f * t,
    Z = p.rho * p.c;
  const logline = (name: string, fn: (x: number) => number, mx: string, my: string) =>
    points(
      name,
      log(0.01, 100).map((x) => [x, fn(x)]),
      mx,
      my,
    );
  if (id === "3.8.1-1")
    return [
      graph(
        p,
        t,
        "扩张与收敛脉冲的加权声压保持形状",
        "半径 r (m)",
        "加权声压 r p (Pa·m)",
        [0.1, 10],
        [0, 1],
        [
          curve(
            "扩张脉冲",
            (r) => p.pa * Math.exp(-(((r - 3 - p.c * t) / 0.5) ** 2)),
            [0.1, 10],
            "linspace(.1,10,801)",
            "pa*exp(-((x-3-c*tView)/.5).^2)",
            "-",
            801,
          ),
          curve(
            "收敛脉冲",
            (r) => p.pa * Math.exp(-(((r - 7 + p.c * t) / 0.5) ** 2)),
            [0.1, 10],
            "linspace(.1,10,801)",
            "pa*exp(-((x-7+c*tView)/.5).^2)",
            "--",
            801,
          ),
        ],
        "",
      ),
    ];
  if (id === "3.8.1-2" || id === "3.8.4-1")
    // Fixed physical observation radii; default kr = 0.5, 2, 10 in the energy panels.
    return (
      id === "3.8.1-2"
        ? [0.05, 5]
        : [
            (0.5 * 343) / (2 * Math.PI * 1000),
            (2 * 343) / (2 * Math.PI * 1000),
            (10 * 343) / (2 * Math.PI * 1000),
          ]
    ).flatMap((r) =>
      (id === "3.8.1-2" ? [0, 1] : [0, 1, 2]).map((i) =>
        graph(
          p,
          0,
          `距离 ${Number(r.toPrecision(3))} m：${["声压", "质点振速", "声能流与声强"][i]}`,
          "时间 t (s)",
          ["声压 (Pa)", "振速 (m/s)", "声能流密度 (W/m²)"][i],
          [0, 0.002],
          [-1, 1],
          [
            curve(
              ["声压", "振速", "瞬时声能流"][i],
              (x) => {
                const q = sphericalState(r, x, p.pa, p.f, p.rho, p.c);
                return [q.p, q.u, q.flux][i];
              },
              [0, 0.002],
              "linspace(0,.002,1601)",
              i === 0
                ? `pa/${r}*cos(w*x-k*${r})`
                : i === 1
                  ? `pa/(Z*${r})*(cos(w*x-k*${r})+sin(w*x-k*${r})/(k*${r}))`
                  : `pa^2/(Z*${r * r})*cos(w*x-k*${r}).*(cos(w*x-k*${r})+sin(w*x-k*${r})/(k*${r}))`,
              "-",
              1601,
            ),
            ...(i === 2
              ? [
                  curve(
                    "时间平均声强",
                    () => p.pa ** 2 / (2 * Z * r * r),
                    [0, 0.002],
                    "linspace(0,.002,1601)",
                    `pa^2/(2*Z*${r * r})*ones(size(x))`,
                    "--",
                    1601,
                  ),
                ]
              : []),
          ],
          "",
        ),
      ),
    );
  if (id === "3.8.2-1" || id === "3.8.2-2" || id === "3.8.3" || id === "3.9.3-1") {
    const cyl = id.startsWith("3.9"),
      imp = cyl ? cylindricalImpedance : sphericalImpedance;
    const parts =
      id === "3.8.3" ? [4, 5] : id.endsWith("-1") ? (cyl ? [0, 1, 2, 3] : [0, 1]) : [2, 3];
    return parts.flatMap((i) =>
      [false, true].map((normalized) => {
        const evalY = (x: number) => {
          const z = imp(normalized ? x : k * x);
          return i < 4
            ? [z.re * Z, z.im * Z, magnitude(z) * Z, (phase(z) * 180) / Math.PI][i]
            : i === 4
              ? p.c
              : p.c * (1 + 1 / (normalized ? x : k * x) ** 2);
        };
        const mx = normalized ? "logspace(-2,2,401)" : "logspace(-2,2,401)";
        const zexpr = cyl
          ? `1i*besselh(0,2,${normalized ? "x" : "k*x"})./besselh(1,2,${normalized ? "x" : "k*x"})`
          : `1i*${normalized ? "x" : "k*x"}./(1+1i*${normalized ? "x" : "k*x"})`;
        const my =
          i < 4
            ? [`real(${zexpr})*Z`, `imag(${zexpr})*Z`, `abs(${zexpr})*Z`, `angle(${zexpr})*180/pi`][
                i
              ]
            : i === 4
              ? "c*ones(size(x))"
              : `c*(1+1./(${normalized ? "x" : "k*x"}).^2)`;
        return graph(
          p,
          t,
          ["波阻", "波抗", "阻抗幅值", "阻抗相角", "声压相速度", "振速相速度"][i] +
            (normalized ? "：无量纲距离比较" : "：物理距离分布"),
          normalized ? "无量纲距离 kr（—）" : "距离 r (m)",
          i < 3 ? "声阻抗 (Pa·s/m)" : i === 3 ? "相角 (°)" : "相速度 (m/s)",
          [0.01, 100],
          [0, 1],
          [logline(["波阻", "波抗", "模值", "相角", "声压相速度", "振速相速度"][i], evalY, mx, my)],
          "",
          { xscale: "log", ...(i === 5 ? { yscale: "log" as const } : {}) },
        );
      }),
    );
  }
  if (id === "3.8.4-2")
    return [
      graph(
        p,
        t,
        "球面扩展：距离每加倍声压级降低 6.02 dB",
        "距离 r (m)",
        "声压级 (dB)",
        [1, 100],
        [-40, 0],
        [
          points(
            "球面波声压级",
            log(1, 100).map((r) => [r, 20 * Math.log10(p.pa / (Math.sqrt(2) * r * 1e-6))]),
            "logspace(0,2,401)",
            "20*log10(pa./(sqrt(2)*x*1e-6))",
          ),
        ],
        "",
        { xscale: "log" },
      ),
    ];
  if (id === "3.8.5-1" || id === "3.8.5-2") {
    const s = p.boundary === 0 ? -1 : 1,
      calc = (x: number, y: number) => {
        const r1 = Math.max(0.05, Math.hypot(x, y - p.depth)),
          r2 = Math.max(0.05, Math.hypot(x, y + p.depth));
        return {
          re: p.pa * (Math.cos(k * r1) / r1 + (s * Math.cos(k * r2)) / r2),
          im: -p.pa * (Math.sin(k * r1) / r1 + (s * Math.sin(k * r2)) / r2),
        };
      };
    const setup = "sgn=2*boundary-1;";
    if (id.endsWith("-1")) {
      const xs = lin(-5, 5, 161),
        ys = lin(-4, 4, 81),
        z = ys.map((y) =>
          xs.map((x) => {
            const a = calc(x, y);
            return a.re * Math.cos(tau) - a.im * Math.sin(tau);
          }),
        );
      return [
        graph(
          p,
          t,
          s < 0 ? "软界面：反相虚源构成偶极子场" : "硬界面：同相虚源构成同性极子场",
          "水平位置 x (m)",
          "深度坐标 y (m)",
          [-5, 5],
          [-4, 4],
          [
            points(
              "实源与虚源位置",
              [
                [0, -p.depth],
                [0, p.depth],
              ],
              "[0 0]",
              "[-depth depth]",
              { marker: "o", style: "none", geometry: { key: "depth", axis: "y" } },
            ),
          ],
          setup +
            "[XX,YY]=meshgrid(linspace(-5,5,161),linspace(-4,4,81));r1=max(.05,hypot(XX,YY-depth));r2=max(.05,hypot(XX,YY+depth));Pfield=pa*real(exp(1i*(tau-k*r1))./r1+sgn*exp(1i*(tau-k*r2))./r2);",
          {
            annotations: [{ axis: "y", value: 0, label: "分界面；负深度为镜像构造区" }],
            field: {
              x: xs,
              y: ys,
              z,
              limits: [-4 * p.pa, 4 * p.pa],
              map: "RdBu",
              label: "声压 (Pa)",
            },
          },
          { field: { x: "linspace(-5,5,161)", y: "linspace(-4,4,81)", z: "Pfield" } },
        ),
      ];
    }
    return [
      graph(
        p,
        t,
        "固定水平距离处的劳埃德镜干涉",
        "接收深度 y (m)",
        "声压级 (dB)",
        [0, 4],
        [0, 150],
        [
          curve(
            "镜像叠加声压级",
              (y) => {
                const amplitude = magnitude(calc(p.distance, y));
                // The pressure-release surface is an exact null (−∞ dB),
                // not a finite floor to include in the data-driven limits.
                return amplitude > 0 ? 20 * Math.log10(amplitude / (Math.sqrt(2) * 1e-6)) : NaN;
              },
            [0, 4],
            "linspace(0,4,801)",
              "p3FiniteSPL(abs(pa*(exp(-1i*k*sqrt(distance^2+(x-depth).^2))./sqrt(distance^2+(x-depth).^2)+sgn*exp(-1i*k*sqrt(distance^2+(x+depth).^2))./sqrt(distance^2+(x+depth).^2))))",
            "-",
            801,
          ),
        ],
          setup,
      ),
    ];
  }
  if (id === "3.9.1")
    return [
      graph(
        p,
        t,
        "零阶柱函数及远场渐近正余弦（无量纲函数比较）",
        "无量纲自变量 kr（—）",
        "柱函数（—）",
        [0.1, 20],
        [-2, 2],
        [
          curve(
            "第一类贝塞尔函数",
            (x) => cylindricalBessel(x).J0,
            [0.1, 20],
            "linspace(.1,20,801)",
            "besselj(0,x)",
            "-",
            801,
          ),
          curve(
            "第二类贝塞尔函数",
            (x) => cylindricalBessel(x).Y0,
            [0.1, 20],
            "linspace(.1,20,801)",
            "bessely(0,x)",
            "-",
            801,
          ),
          curve(
            "渐近余弦",
            (x) => Math.sqrt(2 / (Math.PI * x)) * Math.cos(x - Math.PI / 4),
            [0.1, 20],
            "linspace(.1,20,801)",
            "sqrt(2./(pi*x)).*cos(x-pi/4)",
            "--",
            801,
          ),
          curve(
            "渐近正弦",
            (x) => Math.sqrt(2 / (Math.PI * x)) * Math.sin(x - Math.PI / 4),
            [0.1, 20],
            "linspace(.1,20,801)",
            "sqrt(2./(pi*x)).*sin(x-pi/4)",
            ":",
            801,
          ),
          points(
            "指定自变量的第一类函数",
            [[p.argument, cylindricalBessel(p.argument).J0]],
            "argument",
            "besselj(0,argument)",
            { marker: "o", style: "none" },
          ),
        ],
        "",
      ),
    ];
  if (id === "3.9.2-1")
    return [0.05, 0.5, 5].flatMap((r) =>
      [0, 1].map((i) =>
        graph(
          p,
          0,
          `距离 ${r} m 的${i ? "振速" : "声压"}`,
          "时间 t (s)",
          i ? "振速 (m/s)" : "声压 (Pa)",
          [0, 0.01],
          [-1, 1],
          [
            curve(
              i ? "质点振速" : "声压",
              (x) => {
                const q = cylindricalState(k * r, 2 * Math.PI * p.f * x);
                return p.pa * (i ? q.u / Z : q.p);
              },
              [0, 0.01],
              "linspace(0,.01,1601)",
              i
                ? `pa/Z*real(-1i*besselh(1,2,k*${r})*exp(1i*w*x))`
                : `pa*real(besselh(0,2,k*${r})*exp(1i*w*x))`,
              "-",
              1601,
            ),
          ],
          "",
        ),
      ),
    );
  if (id === "3.9.2-2")
    return [
      graph(
        p,
        t,
        "扩张柱面波在三个时刻的空间分布",
        "半径 r (m)",
        "声压 (Pa)",
        [0.01, 10],
        [-1, 1],
        [0, Math.PI / 3, (2 * Math.PI) / 3].map((ph, i) =>
          curve(
            `相位偏移 ${i}π/3`,
            (x) => p.pa * cylindricalState(k * x, tau + ph).p,
            [0.01, 10],
            "linspace(.01,10,1601)",
            `pa*real(besselh(0,2,k*x)*exp(1i*(tau+${ph})))`,
            i ? "--" : "-",
            1601,
          ),
        ),
        "",
      ),
    ];
  return [
    graph(
      p,
      t,
      "几何扩展：平面、柱面与球面波的级随距离变化",
      "距离 r (m)",
      "声压级 (dB)",
      [1, 100],
      [0, 140],
      [0, 1, 2].map((n) =>
        points(
          ["平面波", "柱面波", "球面波"][n],
          log(1, 100).map((x) => [x, p.level - 10 * n * Math.log10(x / p.reference)]),
          "logspace(0,2,401)",
          `level-${10 * n}*log10(x/reference)`,
        ),
      ),
      "",
      { xscale: "log" },
    ),
  ];
}
