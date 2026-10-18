import { graph, curve, points, lin, log, normalSetup, obSetup } from "../content/p3";
import type { Values } from "../content/p1";
import type { Panel } from "./types";
import { arrow } from "./p1Helpers";
import {
  normalInterface,
  oblique,
  interfaceAngles,
  magnitude,
  phase,
  harmonic,
  whisperRays,
} from "../physics/chapter3b";
const angles: [number, number] = [0, 90];
const logCurve = (name: string, fn: (x: number) => number, my: string) =>
  points(
    name,
    log(1e-4, 1e4).map((x) => [x, fn(x)]),
    "logspace(-4,4,401)",
    my,
  );
export function normalFigure(id: string, p: Values, t = 0): Panel[] {
  const q = normalInterface(p.Z1, p.Z2),
    k = (2 * Math.PI * p.f) / p.c,
    tau = 2 * Math.PI * p.f * t;
  const range: [number, number] = [-3, 3];
  if (id === "3.6.1")
    return [0, 1].map((i) =>
      graph(
        p,
        t,
        i ? "法向振速连续" : "声压连续",
        "位置 x (m)",
        i ? "振速幅值 (m/s)" : "声压幅值 (Pa)",
        range,
        [0, 1],
        [
          curve(
            i ? "法向振速" : "声压",
            (x) =>
              p.pa *
              (x < 0
                ? Math.sqrt(1 + q.R * q.R + (i ? -2 : 2) * q.R * Math.cos(2 * k * x)) /
                  (i ? p.Z1 : 1)
                : q.D / (i ? p.Z2 : 1)),
            range,
            "linspace(-3,3,1201)",
            i
              ? "pa*(abs(exp(-1i*k*x)-Rp*exp(1i*k*x)).*(x<0)/Z1+Dp/Z2*(x>=0))"
              : "pa*(abs(exp(-1i*k*x)+Rp*exp(1i*k*x)).*(x<0)+Dp*(x>=0))",
            "-",
            1201,
          ),
        ],
        normalSetup,
        { annotations: [{ axis: "x", value: 0, label: "两种介质分界面" }] },
      ),
    );
  if (id === "3.6.2")
    return [
      graph(
        p,
        t,
        "入射、反射、透射与合成声压",
        "位置 x (m)",
        "声压 (Pa)",
        range,
        [-2, 2],
        [
          curve(
            "入射波",
            (x) => p.pa * Math.cos(tau - k * x),
            [-3, 0],
            "linspace(-3,0,801)",
            "pa*cos(tau-k*x)",
            "-",
            801,
          ),
          curve(
            "反射波",
            (x) => p.pa * q.R * Math.cos(tau + k * x),
            [-3, 0],
            "linspace(-3,0,801)",
            "pa*Rp*cos(tau+k*x)",
            "--",
            801,
          ),
          curve(
            "透射波",
            (x) => p.pa * q.D * Math.cos(tau - ((2 * Math.PI * p.f) / p.c2) * x),
            [0, 3],
            "linspace(0,3,801)",
            "pa*Dp*cos(tau-2*pi*f/c2*x)",
            "-",
            801,
          ),
          curve(
            "入射侧合成",
            (x) => p.pa * (Math.cos(tau - k * x) + q.R * Math.cos(tau + k * x)),
            [-3, 0],
            "linspace(-3,0,801)",
            "pa*(cos(tau-k*x)+Rp*cos(tau+k*x))",
            ":",
            801,
          ),
        ],
        normalSetup,
        { annotations: [{ axis: "x", value: 0, label: "界面" }] },
      ),
    ];
  if (id === "3.6.3" || id === "3.6.5")
    return [
      graph(
        p,
        t,
        id === "3.6.3" ? "声压与振速的四个幅度系数" : "反射与透射声强系数之和为一",
        "阻抗比 Z₂/Z₁（—）",
        "系数（—）",
        [1e-4, 1e4],
        [-1, 2],
        id === "3.6.3"
          ? [
              logCurve("声压反射系数", (x) => (x - 1) / (x + 1), "(x-1)./(x+1)"),
              logCurve("声压折射系数", (x) => (2 * x) / (1 + x), "2*x./(1+x)"),
              logCurve("振速反射系数", (x) => (1 - x) / (1 + x), "(1-x)./(1+x)"),
              logCurve("振速折射系数", (x) => 2 / (1 + x), "2./(1+x)"),
              points("当前介质声压反射系数", [[p.Z2 / p.Z1, q.R]], "Z2/Z1", "Rp", {
                marker: "o",
                style: "none",
              }),
            ]
          : [
              logCurve("声强反射系数", (x) => ((x - 1) / (x + 1)) ** 2, "((x-1)./(x+1)).^2"),
              logCurve("声强透射系数", (x) => (4 * x) / (1 + x) ** 2, "4*x./(1+x).^2"),
              logCurve("两者之和", () => 1, "ones(size(x))"),
              points("当前透射系数", [[p.Z2 / p.Z1, q.t]], "Z2/Z1", "4*Z1*Z2/(Z1+Z2)^2", {
                marker: "o",
                style: "none",
              }),
            ],
        normalSetup,
        { xscale: "log" },
      ),
    ];
  const R = id === "3.6.4" ? [0, 0.6, -0.6, 1, -1][p.boundary] : -1;
  const setup = normalSetup + `Rlocal=${id === "3.6.4" ? "p3Boundary(boundary)" : "-1"};`;
  if (id === "3.6.4")
    return [0, 1].map((i) =>
      graph(
        p,
        t,
        ["匹配", "硬", "软", "绝对硬", "绝对软"][p.boundary] +
          "边界：" +
          (i ? "振速幅值" : "声压幅值"),
        "距界面 d (m)",
        i ? "振速幅值 (m/s)" : "声压幅值 (Pa)",
        [0, 3],
        [0, 2],
        [
          curve(
            i ? "振速包络" : "声压包络",
            (d) =>
              (p.pa * Math.sqrt(1 + R * R + (i ? -2 : 2) * R * Math.cos(2 * k * d))) /
              (i ? p.Z1 : 1),
            [0, 3],
            "linspace(0,3,1201)",
            `pa*abs(exp(1i*k*x)${i ? "-" : "+"}Rlocal*exp(-1i*k*x))${i ? "/Z1" : ""}`,
            "-",
            1201,
          ),
        ],
        setup,
        { annotations: [{ axis: "x", value: 0, label: i ? "界面振速" : "界面声压" }] },
      ),
    );
  if (id === "3.6.6-1")
    return [0, 1].map((i) =>
      graph(
        p,
        t,
        i ? "振速波腹位于软界面" : "声压波节位于软界面",
        "距界面 d (m)",
        i ? "振速 (m/s)" : "声压 (Pa)",
        [0, 3],
        [-2, 2],
        [0, Math.PI / 4, Math.PI / 2].map((ph, j) =>
          curve(
            `相位偏移 ${j}π/4`,
            (d) =>
              i
                ? ((2 * p.pa) / p.Z1) * Math.cos(k * d) * Math.cos(tau + ph)
                : -2 * p.pa * Math.sin(k * d) * Math.sin(tau + ph),
            [0, 3],
            "linspace(0,3,1201)",
            i ? `2*pa/Z1*cos(k*x)*cos(tau+${ph})` : `-2*pa*sin(k*x)*sin(tau+${ph})`,
            j ? "--" : "-",
            1201,
          ),
        ),
        setup,
      ),
    );
  return [
    graph(
      p,
      t,
      "驻波储存能量，时间平均声强为零",
      "距界面 d (m)",
      "能量密度 (J/m³)",
      [0, 3],
      [0, 1],
      [
        curve(
          "声势能密度",
          (d) => ((2 * p.pa ** 2) / (p.Z1 * p.c)) * Math.sin(k * d) ** 2 * Math.sin(tau) ** 2,
          [0, 3],
          "linspace(0,3,1201)",
          "2*pa^2/(Z1*c)*sin(k*x).^2*sin(tau)^2",
          "-",
          1201,
        ),
        curve(
          "声动能密度",
          (d) => ((2 * p.pa ** 2) / (p.Z1 * p.c)) * Math.cos(k * d) ** 2 * Math.cos(tau) ** 2,
          [0, 3],
          "linspace(0,3,1201)",
          "2*pa^2/(Z1*c)*cos(k*x).^2*cos(tau)^2",
          "--",
          1201,
        ),
        {
          ...curve("平均声强", () => 0, [0, 3], "linspace(0,3,1201)", "zeros(size(x))", ":", 1201),
          axis: "right",
        },
      ],
      setup,
      { rightLabel: "平均声强 (W/m²)", rightLim: [-1, 1] },
    ),
  ];
}
export const scenarioPairs = [
  [1.5, 0.5],
  [1.5, 2],
  [0.7, 2],
  [0.7, 0.5],
];
export const scenarioSetup =
  "scenarios=[1.5 .5;1.5 2;.7 2;.7 .5];c2=c*scenarios(scenario+1,1);Z2=Z1*scenarios(scenario+1,2);";
export function obliqueFigure(id: string, p: Values, t = 0): Panel[] {
  let a = { ...p };
  if (id === "3.6.9") {
    const v = scenarioPairs[p.scenario];
    a = { ...p, c2: p.c * v[0], Z2: p.Z1 * v[1] };
  }
  const q = oblique(a.Z1, a.Z2, a.c, a.c2, a.theta),
    k = (2 * Math.PI * a.f) / a.c,
    k2 = (2 * Math.PI * a.f) / a.c2,
    st = Math.sin((a.theta * Math.PI) / 180),
    tau = 2 * Math.PI * a.f * t;
  const setup = (id === "3.6.9" ? scenarioSetup : "") + obSetup;
  if (id === "3.6.7" || id === "3.6.10-1") {
    const tir = id === "3.6.10-1",
      xs = lin(-2, 2, 161),
      ys = lin(tir ? 0 : -2, tir ? 0.5 : 2, 81);
    const z = ys.map((y) =>
      xs.map((x) =>
        y < 0
          ? a.pa *
            (Math.cos(tau - k * (st * x + q.ci * y)) + harmonic(q.R, tau - k * (st * x - q.ci * y)))
          : a.pa * Math.exp(k2 * q.ct.im * y) * harmonic(q.D, tau - k * st * x - k2 * q.ct.re * y),
      ),
    );
    const rays = tir
      ? points(
          "平均能流方向",
          arrow("能流方向", [0, 0.05], [0.4 * (q.evanescent ? 1 : q.st), 0.05 + 0.4 * q.ct.re])
            .points,
          "fluxArrow(:,1)'",
          "fluxArrow(:,2)'",
        )
      : points(
          "入射与反射声线",
          [
            [-1.5 * st, -1.5 * q.ci],
            [0, 0],
            [1.5 * st, -1.5 * q.ci],
          ],
          "[-1.5*sind(theta) 0 1.5*sind(theta)]",
          "[-1.5*cosd(theta) 0 -1.5*cosd(theta)]",
        );
    const g = graph(
      p,
      t,
      tir
        ? q.evanescent
          ? "非均匀波：法向衰减，切向能流"
          : "低于临界角：透射为传播波"
        : `入射 ${a.theta}°；${q.evanescent ? "全内反射" : `折射 ${q.theta.toFixed(1)}°`}`,
      "沿界面位置 x (m)",
      "法向坐标 y (m)",
      [-2, 2],
      [tir ? 0 : -2, tir ? 0.5 : 2],
      [
        rays,
        ...(!tir
          ? [
              points(
                "透射声线",
                [
                  [0, 0],
                  [1.5 * q.st, 1.5 * q.ct.re],
                ],
                "[0 1.5*c2/c*sind(theta)]",
                "[0 1.5*real(CT)]",
              ),
            ]
          : []),
      ],
      setup +
        `[XX,YY]=meshgrid(linspace(-2,2,161),linspace(${tir ? 0 : -2},${tir ? 0.5 : 2},81));Pfield=pa*real(exp(1i*(tau-k*(sind(theta)*XX+cosd(theta)*YY)))+RR*exp(1i*(tau-k*(sind(theta)*XX-cosd(theta)*YY)))).*(YY<0)+pa*real(DD*exp(1i*tau-1i*k*sind(theta)*XX-1i*2*pi*f/c2*CT.*max(0,YY))).*(YY>=0);fdx=c2/c*sind(theta);if imag(CT)~=0,fdx=1;end;fluxArrow=arrowPoints([0 .05],[.4*fdx .05+.4*real(CT)],1);`,
      {
        field: {
          x: xs,
          y: ys,
          z,
          limits: [
            -a.pa * Math.max(1 + magnitude(q.R), magnitude(q.D)),
            a.pa * Math.max(1 + magnitude(q.R), magnitude(q.D)),
          ],
          map: "RdBu",
          label: "声压 (Pa)",
        },
        textLabels: tir
          ? []
          : [
              { x: -1.5, y: -1.6, text: "入射" },
              { x: 0.7, y: -1.6, text: "反射" },
              { x: 0.7, y: 1.6, text: "透射" },
            ],
      },
      {
        field: {
          x: "linspace(-2,2,161)",
          y: `linspace(${tir ? 0 : -2},${tir ? 0.5 : 2},81)`,
          z: "Pfield",
        },
      },
    );
    return [g];
  }
  if (id === "3.6.8-1")
    return [
      graph(
        p,
        t,
        "相同迹波长：三列波沿界面的相位一致",
        "界面位置 x (m)",
        "声压相位示意（—）",
        [-2, 2],
        [-1, 4],
        [0, 1, 2].map((i) =>
          curve(
            ["入射迹波", "反射迹波（上移 1）", "透射迹波（上移 2）"][i],
            (x) => Math.cos(k * st * x) + i,
            [-2, 2],
            "linspace(-2,2,801)",
            `cos(k*sind(theta)*x)+${i}`,
            "-",
            801,
          ),
        ),
        setup,
      ),
    ];
  if (id === "3.6.8-2" || id === "3.6.9" || id === "3.6.12-2") {
    const both = id === "3.6.12-2",
      only = id === "3.6.9",
      an = interfaceAngles(a.Z1, a.Z2, a.c, a.c2),
      annotations: NonNullable<Panel["annotations"]> = [];
    if (only && Number.isFinite(an.critical))
      annotations.push({ axis: "x", value: an.critical, label: "临界角" });
    if (only && Number.isFinite(an.brewster))
      annotations.push({ axis: "x", value: an.brewster, label: "全透射角" });
    const title = only
      ? `${Number.isFinite(an.critical) ? "有临界角" : "无临界角：透射侧声速不大于入射侧"}；${Number.isFinite(an.brewster) ? "有全透射角" : "无全透射角：阻抗与声速比不满足条件"}`
      : both
        ? "法向功率守恒：声强系数还需投影"
        : "斜入射声压反射与折射系数";
    const cs = only
      ? [
          curve(
            "反射系数模值",
            (x) => magnitude(oblique(a.Z1, a.Z2, a.c, a.c2, x).R),
            angles,
            "linspace(0,90,901)",
            "abs(Rs)",
            "-",
            901,
          ),
        ]
      : both
        ? [
            curve(
              "功率反射系数",
              (x) => oblique(a.Z1, a.Z2, a.c, a.c2, x).r,
              angles,
              "linspace(0,90,901)",
              "abs(Rs).^2",
              "-",
              901,
            ),
            curve(
              "声强透射系数",
              (x) => oblique(a.Z1, a.Z2, a.c, a.c2, x).tI,
              angles,
              "linspace(0,90,901)",
              "Z1/Z2*abs(Ds).^2",
              "-",
              901,
            ),
            curve(
              "功率透射系数",
              (x) => oblique(a.Z1, a.Z2, a.c, a.c2, x).t,
              angles,
              "linspace(0,90,901)",
              "Z1/Z2*abs(Ds).^2.*real(Cs)./cosd(min(x,89.999999))",
              "--",
              901,
            ),
            curve("功率系数之和", () => 1, angles, "linspace(0,90,901)", "ones(size(x))", ":", 901),
          ]
        : [
            curve(
              "反射系数实部",
              (x) => oblique(a.Z1, a.Z2, a.c, a.c2, x).R.re,
              angles,
              "linspace(0,90,901)",
              "real(Rs)",
              "-",
              901,
            ),
            curve(
              "反射系数虚部",
              (x) => oblique(a.Z1, a.Z2, a.c, a.c2, x).R.im,
              angles,
              "linspace(0,90,901)",
              "imag(Rs)",
              "--",
              901,
            ),
            curve(
              "折射系数实部",
              (x) => oblique(a.Z1, a.Z2, a.c, a.c2, x).D.re,
              angles,
              "linspace(0,90,901)",
              "real(Ds)",
              "-",
              901,
            ),
            curve(
              "折射系数虚部",
              (x) => oblique(a.Z1, a.Z2, a.c, a.c2, x).D.im,
              angles,
              "linspace(0,90,901)",
              "imag(Ds)",
              ":",
              901,
            ),
          ];
    return [
      graph(
        p,
        t,
        title,
        "入射角 θᵢ (°)",
        "系数（—）",
        angles,
        [-1, 2],
        cs,
        setup +
          "[Rs,Ds,Cs]=p3Oblique(Z1,Z2,c,c2,linspace(0,90,901));[th0,thc]=p3Angles(Z1,Z2,c,c2);",
        { annotations },
        { annotations: annotations.map((a) => (a.label === "临界角" ? "thc" : "th0")) },
      ),
    ];
  }
  if (id === "3.6.10-2")
    return [
      graph(
        p,
        t,
        "法向幅值降至原值的 1/e 所需深度",
        "入射角 θᵢ (°)",
        "穿透深度 (m)",
        angles,
        [0, 1],
        [
          curve(
            "穿透深度",
            (x) => {
              const s = (a.c2 / a.c) * Math.sin((x * Math.PI) / 180);
              return s > 1 ? a.c2 / (2 * Math.PI * a.f * Math.sqrt(s * s - 1)) : NaN;
            },
            angles,
            "linspace(0,90,901)",
            "p3Depth(x,c,c2,f)",
            "-",
            901,
          ),
        ],
        setup,
      ),
    ];
  if (id === "3.6.11-1")
    return [
      graph(
        p,
        t,
        "圆形光滑围墙内的掠射声线路径",
        "位置 x (m)",
        "示意坐标 y (m)",
        [-50, 50],
        [-50, 50],
        [
          points(
            "圆形围墙",
            lin(0, 2 * Math.PI).map((x) => [p.radius * Math.cos(x), p.radius * Math.sin(x)]),
            "radius*cos(linspace(0,2*pi,401))",
            "radius*sin(linspace(0,2*pi,401))",
            { geometry: { key: "radius", axis: "x" } },
          ),
          points("声线路径", whisperRays(p.radius, p.source, p.launch), "rays(:,1)'", "rays(:,2)'"),
          points("声源", [[p.radius * p.source, 0]], "radius*source", "0", {
            marker: "o",
            style: "none",
          }),
        ],
        "rays=p3Rays(radius,source,launch);",
        { equalAspect: true },
      ),
    ];
  if (id === "3.6.11-2")
    return scenarioPairs.map(([cr, zr], i) =>
      graph(
        p,
        t,
        `情形 ${i + 1}：声速比 ${cr}，阻抗比 ${zr}`,
        "入射角 θᵢ (°)",
        "反射系数模值（—）",
        angles,
        [0, 1],
        [
          curve(
            "反射系数模值",
            (x) => magnitude(oblique(1, zr, 1, cr, x).R),
            angles,
            "linspace(0,90,901)",
            "abs(Rs)",
            "-",
            901,
          ),
          {
            ...curve(
              "反射相角",
              (x) => (phase(oblique(1, zr, 1, cr, x).R) * 180) / Math.PI,
              angles,
              "linspace(0,90,901)",
              "angle(Rs)*180/pi",
              "--",
              901,
            ),
            axis: "right",
          },
        ],
        `[Rs,Ds]=p3Oblique(1,${zr},1,${cr},linspace(0,90,901));`,
        { rightLabel: "反射相角 (°)", rightLim: [-180, 180] },
      ),
    );
  const ct = q.ct.re,
    ci = q.ci,
    si = st;
  return [
    graph(
      p,
      t,
      "共同界面足迹与入射、反射、折射声束截面",
      "横向示意坐标（—）",
      "法向示意坐标（—）",
      [-3, 3],
      [-3, 3],
      [
        points(
          "界面足迹",
          [
            [-0.5, 0],
            [0.5, 0],
          ],
          "[-.5 .5]",
          "[0 0]",
        ),
        points(
          "入射束边缘",
          [
            [-0.5 - 2 * si, -2 * ci],
            [-0.5, 0],
            [0.5, 0],
            [0.5 - 2 * si, -2 * ci],
          ],
          "[-.5-2*sind(theta) -.5 .5 .5-2*sind(theta)]",
          "[-2*cosd(theta) 0 0 -2*cosd(theta)]",
        ),
        points(
          "反射束边缘",
          [
            [-0.5 + 2 * si, -2 * ci],
            [-0.5, 0],
            [0.5, 0],
            [0.5 + 2 * si, -2 * ci],
          ],
          "[-.5+2*sind(theta) -.5 .5 .5+2*sind(theta)]",
          "[-2*cosd(theta) 0 0 -2*cosd(theta)]",
          { style: "--" },
        ),
        points(
          "透射束边缘",
          [
            [-0.5, 0],
            [-0.5 + 2 * q.st, 2 * ct],
            [0.5 + 2 * q.st, 2 * ct],
            [0.5, 0],
          ],
          "[-.5 -.5+2*c2/c*sind(theta) .5+2*c2/c*sind(theta) .5]",
          "[0 2*real(CT) 2*real(CT) 0]",
        ),
      ],
      setup,
      {
        textLabels: [
          { x: -1, y: -2.6, text: `入射截面宽 ${ci.toFixed(3)}` },
          { x: 1, y: 2.6, text: `透射截面宽 ${ct.toFixed(3)}` },
        ],
      },
    ),
  ];
}
