import { graph, curve, points, lin } from "../content/p3";
import type { Values } from "../content/p1";
import type { Panel } from "./types";
import { guideMode, guideCoefficients } from "../physics/chapter3b";
export const guideSetup = "fc=mode*c/(2*h);kx=mode*pi/h;kz=conj(sqrt(complex(k^2-kx^2)));";
export function guideFigure(id: string, p: Values, t = 0): Panel[] {
  const m = guideMode(p.mode, p.f, p.h, p.c),
    tau = 2 * Math.PI * p.f * t;
  if (id === "3.10.1")
    return [
      graph(
        p,
        t,
        "平行刚性壁之间的波导几何",
        "纵向位置 z (m)",
        "截面坐标 x (m)",
        [0, 4],
        [0, 2],
        [
          points(
            "上下刚性壁",
            [
              [0, 0],
              [4, 0],
              [4, p.h],
              [0, p.h],
            ],
            "[0 4 4 0]",
            "[0 0 h h]",
            { geometry: { key: "h", axis: "y" } },
          ),
        ],
        guideSetup,
      ),
      ...[0, 1, 2, 3].map((n) =>
        graph(
          p,
          t,
          `第 ${n} 阶横向本征函数`,
          "截面位置 x (m)",
          "本征函数（—）",
          [0, 2],
          [-1, 1],
          [
            curve(
              "横向本征函数",
              (x) => Math.cos((n * Math.PI * x) / p.h),
              [0, p.h],
              "linspace(0,h,401)",
              `cos(${n}*pi*x/h)`,
            ),
            points(
              "层厚范围",
              [
                [0, 0],
                [p.h, 0],
              ],
              "[0 h]",
              "[0 0]",
              { style: ":", geometry: { key: "h", axis: "x" } },
            ),
          ],
          guideSetup,
        ),
      ),
    ];
  if (id === "3.10.2") {
    const co = guideCoefficients(p.sourceType, p.offset, p.width, p.a1, p.a2, p.a3);
    const source = (x: number) =>
      p.sourceType === 0
        ? 1
        : p.sourceType === 1
          ? Math.exp(-(((x / p.h - p.offset) / p.width) ** 2))
          : 1 +
            p.a1 * Math.cos((Math.PI * x) / p.h) +
            p.a2 * Math.cos((2 * Math.PI * x) / p.h) +
            p.a3 * Math.cos((3 * Math.PI * x) / p.h);
    const setup =
      "co=p3Coefficients(sourceType,offset,width,a1,a2,a3);ns=0:5;betas=conj(sqrt(complex(k^2-(ns*pi/h).^2)));betas(abs(betas)<1e-8)=1e-8;An=rho*w*v0*co./betas;";
    const amplitudes = co.map((a, n) => {
      const v = guideMode(n, p.f, p.h, p.c);
      return (p.rho * 2 * Math.PI * p.f * p.v0 * a) / Math.max(1e-8, Math.hypot(v.kz, v.decay));
    });
    const xs = lin(0, 4, 161),
      ys = lin(0, p.h, 81),
      z = ys.map((y) =>
        xs.map((x) =>
          co.reduce((s, a, n) => {
            const v = guideMode(n, p.f, p.h, p.c);
            return (
              s +
              ((Math.cos((n * Math.PI * y) / p.h) *
                Math.exp(-v.decay * x) *
                p.rho *
                2 *
                Math.PI *
                p.f *
                p.v0 *
                a) /
                Math.max(1e-8, Math.hypot(v.kz, v.decay))) *
                (v.propagating || !v.decay ? Math.cos(tau - v.kz * x) : -Math.sin(tau))
            );
          }, 0),
        ),
      );
    const limit = Math.max(
      1e-12,
      amplitudes.reduce((s, a) => s + Math.abs(a), 0),
    );
    return [
      graph(
        p,
        t,
        "均匀、偏置或自定义的源振速",
        "截面位置 x (m)",
        "源振速 (m/s)",
        [0, 2],
        [0, 1],
        [
          curve(
            "源振速分布",
            (x) => p.v0 * source(x),
            [0, p.h],
            "linspace(0,h,401)",
            "v0*p3Source(x/h,sourceType,offset,width,a1,a2,a3)",
          ),
          points(
            "源截面范围",
            [
              [0, 0],
              [p.h, 0],
            ],
            "[0 h]",
            "[0 0]",
            { geometry: { key: "h", axis: "x" }, style: ":" },
          ),
        ],
        setup,
      ),
      graph(
        p,
        t,
        "正交展开得到各阶压力激励系数",
        "模式阶数 n（—）",
        "压力系数幅值 (Pa)",
        [-1, 6],
        [0, 1],
        [
          points(
            "模态压力系数",
            amplitudes.map((a, n) => [n, Math.abs(a)]),
            "0:5",
            "abs(An)",
            { kind: "bar" },
          ),
        ],
        setup,
        { integerX: true },
      ),
      graph(
        p,
        t,
        "源分布激发的波导合成声场",
        "纵向位置 z (m)",
        "截面坐标 x (m)",
        [0, 4],
        [0, 2],
        [],
        setup +
          "[XX,YY]=meshgrid(linspace(0,4,161),linspace(0,h,81));Pfield=zeros(size(XX));for nn=0:5,Pfield=Pfield+real(An(nn+1)*cos(nn*pi*YY/h).*exp(1i*tau-1i*betas(nn+1)*XX));end;",
        { field: { x: xs, y: ys, z, limits: [-limit, limit], map: "RdBu", label: "声压 (Pa)" } },
        { field: { x: "linspace(0,4,161)", y: "linspace(0,h,81)", z: "Pfield" } },
      ),
    ];
  }
  if (id === "3.10.3-1") {
    const xs = lin(0, 3000, 161),
      ys = lin(0, 5, 81),
      z = ys.map((n) => xs.map((f) => (f > (Math.round(n) * p.c) / (2 * p.h) ? 1 : 0)));
    return [
      graph(
        p,
        t,
        "频率超过本阶截止频率才可传播",
        "频率 f (Hz)",
        "模式阶数 n（—）",
        [0, 3000],
        [0, 5],
        [
          points(
            "各阶截止边界",
            lin(0, 5, 6).map((n) => [(n * p.c) / (2 * p.h), n]),
            "(0:5)*c/(2*h)",
            "0:5",
            { marker: "o", style: "--" },
          ),
          points("当前频率与阶数", [[p.f, p.mode]], "f", "mode", { marker: "o", style: "none" }),
        ],
        guideSetup +
          "[XX,YY]=meshgrid(linspace(0,3000,161),linspace(0,5,81));Pfield=double(XX>round(YY)*c/(2*h));",
        {
          field: { x: xs, y: ys, z, limits: [0, 1], categories: [{value: 0, label: "截止", color: "#eeeeee"}, {value: 1, label: "可传播", color: "#b6d5f0"}], label: "传播类别" },
        },
        { field: { x: "linspace(0,3000,161)", y: "linspace(0,5,81)", z: "Pfield" } },
      ),
    ];
  }
  if (id === "3.10.3-2") {
    const xs = lin(0, 4, 161),
      ys = lin(0, p.h, 81),
      z = ys.map((y) =>
        xs.map((x) => Math.cos(m.kx * y) * Math.exp(-m.decay * x) * Math.cos(tau - m.kz * x)),
      );
    return [
      graph(
        p,
        t,
        m.propagating ? "当前频率高于截止：此阶传播" : "当前频率低于截止：沿纵向指数衰减",
        "纵向位置 z (m)",
        "截面坐标 x (m)",
        [0, 4],
        [0, 2],
        [
          points(
            "层厚范围",
            [
              [0, 0],
              [0, p.h],
            ],
            "[0 0]",
            "[0 h]",
            { geometry: { key: "h", axis: "y" }, style: "none" },
          ),
        ],
        guideSetup +
          "[XX,YY]=meshgrid(linspace(0,4,161),linspace(0,h,81));Pfield=cos(kx*YY).*exp(imag(kz)*XX).*cos(tau-real(kz)*XX);",
        { field: { x: xs, y: ys, z, limits: [-1, 1], map: "RdBu", label: "归一化声压（—）" } },
        { field: { x: "linspace(0,4,161)", y: "linspace(0,h,81)", z: "Pfield" } },
      ),
    ];
  }
  if (id === "3.10.4")
    return [0, 1, 2].map((i) => {
      const xs = lin(0, 4, 161),
        ys = lin(0, p.h, 81),
        z = ys.map((y) =>
          xs.map(
            (x) =>
              Math.exp(-m.decay * x) *
              (i === 0
                ? 0.5 * Math.cos(tau - m.kz * x - m.kx * y)
                : i === 1
                  ? 0.5 * Math.cos(tau - m.kz * x + m.kx * y)
                  : Math.cos(m.kx * y) * Math.cos(tau - m.kz * x)),
          ),
        );
      const rays: [number, number][] = [];
      if (m.propagating && p.mode > 0)
        for (let j = 0; j <= 100; j++) {
          const x = (j * p.h) / Math.tan((m.theta * Math.PI) / 180);
          if (x <= 4) rays.push([x, (j % 2) * p.h]);
        }
      return graph(
        p,
        t,
        ["向上斜行平面波", "向下斜行平面波", "两列斜波叠加成简正波"][i],
        "纵向位置 z (m)",
        "截面坐标 x (m)",
        [0, 4],
        [0, 2],
        [
          points(
            "层厚范围",
            [
              [0, 0],
              [0, p.h],
            ],
            "[0 0]",
            "[0 h]",
            { geometry: { key: "h", axis: "y" }, style: "none" },
          ),
          ...(i === 2 ? [points("折返声线", rays, "rayz", "rayx", { style: "--" })] : []),
        ],
        guideSetup +
          `[XX,YY]=meshgrid(linspace(0,4,161),linspace(0,h,81));Pfield=exp(imag(kz)*XX).*${i === 0 ? ".5.*cos(tau-real(kz)*XX-kx*YY)" : i === 1 ? ".5.*cos(tau-real(kz)*XX+kx*YY)" : "cos(kx*YY).*cos(tau-real(kz)*XX)"};jj=0:100;rayz=jj*h/tan(asin(min(1,kx/k)));rayx=mod(jj,2)*h;valid=rayz<=4 & imag(kz)==0;rayx=rayx(valid);rayz=rayz(valid);`,
        { field: { x: xs, y: ys, z, limits: [-1, 1], map: "RdBu", label: "归一化声压（—）" } },
        { field: { x: "linspace(0,4,161)", y: "linspace(0,h,81)", z: "Pfield" } },
      );
    });
  if (id === "3.10.5-1")
    return [0, 1].map((i) =>
      graph(
        p,
        t,
        i ? "前五阶群速度与频散" : "前五阶相速度与频散",
        "频率 f (Hz)",
        i ? "群速度比（—）" : "相速度比（—）",
        [0, 3000],
        i ? [0, 1] : [0, 5],
        [0, 1, 2, 3, 4].map((n) =>
          curve(
            `第 ${n} 阶`,
            (f) => {
              const m = guideMode(n, f, p.h, p.c);
              return m.propagating ? (i ? m.cg : m.cp) / p.c : NaN;
            },
            [0, 3000],
            "linspace(0,3000,1201)",
            `p3GuideSpeed(x,${n},h,c,${i})`,
            "-",
            1201,
          ),
        ),
        guideSetup,
        {
          unboundedY: !i,
          responseNote: !i ? "截止附近相速度无界，图中显示有限观察范围。" : undefined,
        },
      ),
    );
  const center = p.f,
    delta = 0.01 * center,
    f1 = center - delta,
    f2 = center + delta,
    m1 = guideMode(p.mode, f1, p.h, p.c),
    m2 = guideMode(p.mode, f2, p.h, p.c);
  const cp = (2 * Math.PI * (f1 + f2)) / (m1.kz + m2.kz),
    cg = (2 * Math.PI * (f2 - f1)) / (m2.kz - m1.kz),
    zmax = 20;
  return [
    graph(
      p,
      t,
      "两相近频率的载波与拍包络分别传播",
      "纵向位置 z (m)",
      "归一化声压（—）",
      [0, zmax],
      [-2, 2],
      [
        curve(
          "合成波",
          (z) =>
            Math.cos(2 * Math.PI * f1 * t - m1.kz * z) + Math.cos(2 * Math.PI * f2 * t - m2.kz * z),
          [0, 20],
          "linspace(0,20,1601)",
          "cos(w1*tView-b1*x)+cos(w2*tView-b2*x)",
          "-",
          1601,
        ),
        curve(
          "拍包络上界",
          (z) => 2 * Math.cos(Math.PI * (f2 - f1) * t - ((m2.kz - m1.kz) * z) / 2),
          [0, 20],
          "linspace(0,20,1601)",
          "2*cos((w2-w1)*tView/2-(b2-b1)*x/2)",
          "--",
          1601,
        ),
        curve(
          "拍包络下界",
          (z) => -2 * Math.cos(Math.PI * (f2 - f1) * t - ((m2.kz - m1.kz) * z) / 2),
          [0, 20],
          "linspace(0,20,1601)",
          "-2*cos((w2-w1)*tView/2-(b2-b1)*x/2)",
          ":",
          1601,
        ),
        points("载波相位标记", [[cp * t, 0]], "cpPacket*tView", "0", {
          marker: "o",
          style: "none",
        }),
        points("包络峰标记", [[cg * t, 2]], "cgPacket*tView", "2", {
          marker: "s",
          style: "none",
        }),
      ],
      guideSetup +
        "w1=2*pi*f*.99;w2=2*pi*f*1.01;b1=sqrt((w1/c)^2-kx^2);b2=sqrt((w2/c)^2-kx^2);cpPacket=(w1+w2)/(b1+b2);cgPacket=(w2-w1)/(b2-b1);",
    ),
  ];
}
