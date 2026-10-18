import { graph, curve, points } from "../content/p3";
import type { Values } from "../content/p1";
import { surfaceReflection, standingPressure, magnitude, harmonic } from "../physics/chapter3b";
export const surfaceSetup = "Rs=(res-1+1i*react)/(res+1+1i*react);";
export function surfaceFigure(id: string, p: Values, t = 0) {
  const s = surfaceReflection(p.res, p.react),
    tau = 2 * Math.PI * p.f * t,
    k = (2 * Math.PI * p.f) / p.c;
  if (id === "3.7.1")
    return [
      graph(
        p,
        t,
        "表面反射系数在复平面中的位置",
        "反射系数实部（—）",
        "反射系数虚部（复平面示意坐标）",
        [-1, 1],
        [-1, 1],
        [
          curve(
            "单位圆上半部",
            (x) => Math.sqrt(Math.max(0, 1 - x * x)),
            [-1, 1],
            "linspace(-1,1,401)",
            "sqrt(max(0,1-x.^2))",
            ":",
          ),
          curve(
            "单位圆下半部",
            (x) => -Math.sqrt(Math.max(0, 1 - x * x)),
            [-1, 1],
            "linspace(-1,1,401)",
            "-sqrt(max(0,1-x.^2))",
            ":",
          ),
          points("复反射系数", [[s.R.re, s.R.im]], "real(Rs)", "imag(Rs)", {
            marker: "o",
            style: "none",
          }),
        ],
        surfaceSetup,
        { equalAspect: true },
      ),
      graph(
        p,
        t,
        "一般驻波的幅值包络与剩余行波",
        "距表面 d (m)",
        "声压幅值 (Pa)",
        [0, 2],
        [0, 2],
        [
          curve(
            "驻波包络",
            (d) => p.pa * magnitude(standingPressure(d, k, s.R)),
            [0, 2],
            "linspace(0,2,1201)",
            "pa*abs(exp(1i*k*x)+Rs*exp(-1i*k*x))",
            "-",
            1201,
          ),
          curve(
            "剩余行波幅度",
            () => p.pa * (1 - s.r),
            [0, 2],
            "linspace(0,2,1201)",
            "pa*(1-abs(Rs))*ones(size(x))",
            "--",
            1201,
          ),
        ],
        surfaceSetup,
      ),
    ];
  if (id === "3.7.2-1")
    return [0, 1, 2].map((i) =>
      graph(
        p,
        t,
        ["剩余行波分量", "纯驻波分量", "一般驻波合成场"][i],
        "距表面 d (m)",
        "声压 (Pa)",
        [0, 2],
        [-2, 2],
        [0, Math.PI / 4, Math.PI / 2].map((ph, j) =>
          curve(
            `相位偏移 ${j}π/4`,
            (d) => {
              const tr = (1 - s.r) * Math.cos(tau + ph + k * d),
                st = s.r * Math.cos(tau + ph + k * d) + harmonic(s.R, tau + ph - k * d);
              return p.pa * (i === 0 ? tr : i === 1 ? st : tr + st);
            },
            [0, 2],
            "linspace(0,2,1201)",
            i === 0
              ? `pa*(1-abs(Rs))*cos(tau+${ph}+k*x)`
              : i === 1
                ? `pa*(abs(Rs)*cos(tau+${ph}+k*x)+real(Rs*exp(1i*(tau+${ph}-k*x))))`
                : `pa*(cos(tau+${ph}+k*x)+real(Rs*exp(1i*(tau+${ph}-k*x))))`,
            j ? "--" : "-",
            1201,
          ),
        ),
        surfaceSetup,
      ),
    );
  const dmin = ((s.phi + Math.PI) % (2 * Math.PI)) / (2 * k);
  return [
    graph(
      p,
      t,
      "移动探管测量驻波包络与第一个极小点",
      "距表面 d (m)",
      "声压幅值 (Pa)",
      [0, 2],
      [0, 2],
      [
        curve(
          "声压包络",
          (d) => p.pa * magnitude(standingPressure(d, k, s.R)),
          [0, 2],
          "linspace(0,2,1201)",
          "pa*abs(exp(1i*k*x)+Rs*exp(-1i*k*x))",
          "-",
          1201,
        ),
        points(
          "探管测得声压",
          [[p.probe, p.pa * magnitude(standingPressure(p.probe, k, s.R))]],
          "probe",
          "pa*abs(exp(1i*k*probe)+Rs*exp(-1i*k*probe))",
          { marker: "o", style: "none" },
        ),
      ],
      surfaceSetup + "dmin=mod(angle(Rs)+pi,2*pi)/(2*k);",
      {
        annotations: [
          { axis: "y", value: p.pa * (1 + s.r), label: "最大声压" },
          { axis: "y", value: p.pa * (1 - s.r), label: "最小声压" },
          { axis: "x", value: dmin, label: "第一极小点" },
        ],
      },
      { annotations: ["pa*(1+abs(Rs))", "pa*(1-abs(Rs))", "dmin"] },
    ),
  ];
}
