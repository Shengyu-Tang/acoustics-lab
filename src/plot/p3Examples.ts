import type { Values } from "../content/p1";
import { points } from "../content/p2";
import * as phy from "../physics/chapter3b";
import { physical, line, dot, xmark, ymark, value, grid } from "./physicalExample";
const pi = Math.PI;

export function e361(p: Values) {
  const q = phy.normalInterface(p.Z1, p.Z2),
    range: [number, number] = [-p.c / p.f, p.c2 / p.f];
  return physical(
    p,
    "两侧声压连续且法向振速连续",
    "距流体界面的坐标 x (m)",
    "声压幅值 (Pa)",
    range,
    "[-c/f c2/f]",
    [
      line(
        "界面两侧声压包络",
        (x) =>
          x < 0
            ? p.pa * Math.sqrt(1 + q.R * q.R + 2 * q.R * Math.cos((4 * pi * p.f * x) / p.c))
            : p.pa * q.D,
        range,
        "pa*(abs(exp(-1i*k*x)+Rp*exp(1i*k*x)).*(x<0)+Dp*(x>=0))",
      ),
      {
        ...line(
          "界面两侧法向振速",
          (x) =>
            x < 0
              ? (p.pa / p.Z1) *
                Math.sqrt(1 + q.R * q.R - 2 * q.R * Math.cos((4 * pi * p.f * x) / p.c))
              : (p.pa * q.D) / p.Z2,
          range,
          "pa*(abs(exp(-1i*k*x)-Rp*exp(1i*k*x)).*(x<0)/Z1+Dp/Z2*(x>=0))",
          "--",
        ),
        axis: "right",
      },
    ],
    "Rp=(Z2-Z1)/(Z2+Z1);Dp=1+Rp;",
    {
      rightLabel: "法向振速幅值 (m/s)",
      annotations: [xmark(0, value("rₚ", q.R) + "；" + value("tₚ", q.D))],
    },
    {
      annotations: ["0"],
      annotationLabels: ["sprintf('界面 x = 0；r_p = %.4g；t_p = %.4g',Rp,Dp)"],
    },
  );
}
export function e362(p: Values) {
  const q = phy.normalInterface(p.Z1, p.Z2),
    range: [number, number] = [-p.c / p.f, p.c2 / p.f];
  return physical(
    p,
    "水与流体界面处的三列波（t = 0）",
    "界面法向位置 x (m)",
    "声压 p (Pa)",
    range,
    "[-c/f c2/f]",
    [
      line(
        "入射声压",
        (x) => (x <= 0 ? p.pa * Math.cos((2 * pi * p.f * x) / p.c) : NaN),
        range,
        "p3Mask(pa*cos(k*x),x<=0)",
      ),
      line(
        value("反射，rₚ", q.R),
        (x) => (x <= 0 ? p.pa * q.R * Math.cos((2 * pi * p.f * x) / p.c) : NaN),
        range,
        "p3Mask(pa*Rp*cos(k*x),x<=0)",
        "--",
      ),
      line(
        value("透射，tₚ", q.D),
        (x) => (x >= 0 ? p.pa * q.D * Math.cos((2 * pi * p.f * x) / p.c2) : NaN),
        range,
        "p3Mask(pa*Dp*cos(2*pi*f/c2*x),x>=0)",
      ),
      line(
        "入射侧合成场",
        (x) => (x <= 0 ? p.pa * (1 + q.R) * Math.cos((2 * pi * p.f * x) / p.c) : NaN),
        range,
        "p3Mask(pa*(1+Rp)*cos(k*x),x<=0)",
        ":",
      ),
    ],
    "Rp=(Z2-Z1)/(Z2+Z1);Dp=1+Rp;",
    { annotations: [xmark(0, "水 / 第二流体界面")] },
    { annotations: ["0"] },
  );
}
export function e363(p: Values) {
  const q = phy.normalInterface(p.Z1, p.Z2),
    range: [number, number] = [-p.c / p.f, p.c2 / p.f];
  return physical(
    p,
    "水面反相回波与空气中的微弱透射（右轴放大）",
    "水面法向坐标 x (m)",
    "水中声压 (Pa)",
    range,
    "[-c/f c2/f]",
    [
      line(
        "水中入射波",
        (x) => (x <= 0 ? p.pa * Math.cos((2 * pi * p.f * x) / p.c) : NaN),
        range,
        "p3Mask(pa*cos(k*x),x<=0)",
      ),
      line(
        value("反相反射 rₚ", q.R),
        (x) => (x <= 0 ? p.pa * q.R * Math.cos((2 * pi * p.f * x) / p.c) : NaN),
        range,
        "p3Mask(pa*Rp*cos(k*x),x<=0)",
        "--",
      ),
      {
        ...line(
          value("空气透射 tₚ", q.D),
          (x) => (x >= 0 ? p.pa * q.D * Math.cos((2 * pi * p.f * x) / p.c2) : NaN),
          range,
          "p3Mask(pa*Dp*cos(2*pi*f/c2*x),x>=0)",
        ),
        axis: "right",
      },
    ],
    "Rp=(Z2-Z1)/(Z2+Z1);Dp=1+Rp;",
    { rightLabel: "空气透射声压 (Pa)", annotations: [xmark(0, "水面：压力近似释放")] },
    { annotations: ["0"] },
  );
}
export function e364(p: Values) {
  const q = phy.normalInterface(p.Z1, p.Z2),
    range: [number, number] = [0, p.c / p.f];
  return physical(
    p,
    "钢表面附近的压力波腹与有限阻抗修正",
    "水中距钢表面 d (m)",
    "声压包络幅值 (Pa)",
    range,
    "[0 c/f]",
    [
      line(
        "水—钢实际包络",
        (d) => p.pa * Math.sqrt(1 + q.R * q.R + 2 * q.R * Math.cos((4 * pi * p.f * d) / p.c)),
        range,
        "pa*sqrt(1+Rp^2+2*Rp*cos(2*k*x))",
      ),
      line(
        "绝对硬壁极限",
        (d) => 2 * p.pa * Math.abs(Math.cos((2 * pi * p.f * d) / p.c)),
        range,
        "2*pa*abs(cos(k*x))",
        "--",
      ),
      dot(value("界面 tₚ", q.D), 0, p.pa * q.D, "0", "pa*Dp"),
    ],
    "Rp=(Z2-Z1)/(Z2+Z1);Dp=1+Rp;",
    { annotations: [xmark(0, value("rₚ", q.R))] },
    { annotations: ["0"], annotationLabels: ["sprintf('钢表面 d = 0；r_p = %.4g',Rp)"] },
  );
}
export function e365(p: Values) {
  const q = phy.normalInterface(p.Z1, p.Z2),
    range: [number, number] = [0.5, 3.5],
    loss = -10 * Math.log10(q.t);
  return physical(
    p,
    "从水向空气传递的能量预算",
    "能量通道",
    "相对入射功率",
    range,
    "[.5 3.5]",
    [
      points(
        "入射 / 反射 / 透射功率",
        [
          [1, 1],
          [2, q.r],
          [3, q.t],
        ],
        "[1 2 3]",
        "[1 Rp^2 4*Z1*Z2/(Z1+Z2)^2]",
        { kind: "bar" },
      ),
      dot(value("透射损失", loss, "dB"), 3, q.t, "3", "4*Z1*Z2/(Z1+Z2)^2"),
    ],
    "Rp=(Z2-Z1)/(Z2+Z1);Dp=1+Rp;",
    {
      integerX: true,
      yscale: "log",
      xtickLabels: [
        { value: 1, label: "入射" },
        { value: 2, label: "反射" },
        { value: 3, label: "透射" },
      ],
      annotations: [ymark(q.t, value("声强透射系数", q.t))],
      responseNote: value("rₚ", q.R) + "；" + value("tₚ", q.D),
    },
    { annotations: ["4*Z1*Z2/(Z1+Z2)^2"] },
  );
}
export function e366(p: Values) {
  const u = (2 * p.pa) / p.Z1,
    range: [number, number] = [0, p.c / p.f],
    gap = p.c / (2 * p.f);
  return physical(
    p,
    "软界面处振速波腹与声压波节交错",
    "距软界面 d (m)",
    "振速幅值 (m/s)",
    range,
    "[0 c/f]",
    [
      line(
        "驻波振速包络",
        (d) => u * Math.abs(Math.cos((2 * pi * p.f * d) / p.c)),
        range,
        "2*pa/Z1*abs(cos(k*x))",
      ),
      {
        ...line(
          "驻波声压包络",
          (d) => 2 * p.pa * Math.abs(Math.sin((2 * pi * p.f * d) / p.c)),
          range,
          "2*pa*abs(sin(k*x))",
          "--",
        ),
        axis: "right",
      },
      dot(value("界面振速峰值", u, "m/s"), 0, u, "0", "2*pa/Z1"),
    ],
    "",
    {
      rightLabel: "声压幅值 (Pa)",
      annotations: [xmark(0, "软界面声压波节"), xmark(gap, value("相邻波节距离", gap, "m"))],
    },
    { annotations: ["0", "c/(2*f)"] },
  );
}
export function e367(p: Values) {
  const q = phy.oblique(p.Z1, p.Z2, p.c, p.c2, p.theta),
    s = Math.sin((p.theta * pi) / 180),
    range: [number, number] = [-1.2, 1.2];
  return physical(
    p,
    "水与流体界面上的斜入射声线",
    "沿界面坐标 x (m)",
    "法向示意坐标 y (m)",
    range,
    "[-1.2 1.2]",
    [
      points(
        "入射—反射路径",
        [
          [-s, -q.ci],
          [0, 0],
          [s, -q.ci],
        ],
        "[-sind(theta) 0 sind(theta)]",
        "[-cosd(theta) 0 -cosd(theta)]",
      ),
      points(
        value("折射角", q.theta, "°"),
        [
          [0, 0],
          [q.st, q.ct.re],
        ],
        "[0 c2/c*sind(theta)]",
        "[0 real(CT)]",
        { style: "--" },
      ),
      points(
        "界面",
        [
          [-1.2, 0],
          [1.2, 0],
        ],
        "[-1.2 1.2]",
        "[0 0]",
        { color: "#555555" },
      ),
      dot(value("|rₚ|", phy.magnitude(q.R)), 0, 0, "0", "0"),
    ],
    "[RR,DD,CT]=p3Oblique(Z1,Z2,c,c2,theta);",
    { equalAspect: true, ylim: [-1.2, 1.2] },
    { ylim: "[-1.2 1.2]" },
  );
}
export function e368(p: Values) {
  const q = phy.oblique(p.Z1, p.Z2, p.c, p.c2, p.theta),
    kt = ((2 * pi * p.f) / p.c) * Math.sin((p.theta * pi) / 180),
    span = kt > 1e-9 ? (4 * pi) / kt : (2 * p.c) / p.f,
    range: [number, number] = [0, span];
  return physical(
    p,
    "界面迹波相位匹配：入射加反射等于透射",
    "沿界面的距离 s (m)",
    "界面声压 (Pa)",
    range,
    "[0 qaSpan]",
    [
      line("入射迹波", (x) => p.pa * Math.cos(kt * x), range, "pa*cos(k*sind(theta)*x)"),
      line(
        value("反射迹波 |rₚ|", phy.magnitude(q.R)),
        (x) => p.pa * phy.harmonic(q.R, -kt * x),
        range,
        "pa*real(RR*exp(-1i*k*sind(theta)*x))",
        "--",
      ),
      line(
        value("透射迹波，θₜ", q.theta, "°"),
        (x) => p.pa * phy.harmonic(q.D, -kt * x),
        range,
        "pa*real(DD*exp(-1i*k*sind(theta)*x))",
        ":",
      ),
    ],
    "[RR,DD,CT]=p3Oblique(Z1,Z2,c,c2,theta);qaSpan=2*c/f;if abs(sind(theta))>1e-9,qaSpan=2*c/(f*abs(sind(theta)));end;",
  );
}
export function e369(p: Values) {
  const q = phy.interfaceAngles(p.Z1, p.Z2, p.c, p.c2),
    range: [number, number] = [0, 90];
  return physical(
    p,
    "全透射零点与临界角位于不同入射方向",
    "入射角 θᵢ (°)",
    "声压反射系数模值 |rₚ|",
    range,
    "[0 90]",
    [
      line(
        "两种流体的反射系数",
        (x) => phy.magnitude(phy.oblique(p.Z1, p.Z2, p.c, p.c2, x).R),
        range,
        "abs(p3Oblique(Z1,Z2,c,c2,x))",
      ),
      dot("全透射零点", q.brewster, 0, "th0", "0"),
      dot("临界入射", q.critical, 1, "thc", "1"),
    ],
    "[th0,thc]=p3Angles(Z1,Z2,c,c2);",
    {
      annotations: [
        xmark(q.brewster, value("全透射角", q.brewster, "°")),
        xmark(q.critical, value("临界角", q.critical, "°")),
      ],
    },
    { annotations: ["th0", "thc"] },
  );
}
export function e3610(p: Values) {
  const q = phy.oblique(p.Z1, p.Z2, p.c, p.c2, p.theta),
    alpha = ((-2 * pi * p.f) / p.c2) * q.ct.im,
    depth = alpha > 0 ? 1 / alpha : 1,
    range: [number, number] = [0, 0.4];
  return physical(
    p,
    "空气入射水面后的非均匀透射波",
    "离界面法向距离 y (m)",
    "透射声压相对幅值 |p(y)|/|p(0)|",
    range,
    "[0 0.4]",
    [
      line("透射侧声压指数包络", (y) => Math.exp(-alpha * y), range, "exp(-qaAlpha*x)"),
      dot(
        value("1/e 穿透深度", alpha > 0 ? depth : NaN, "m"),
        depth,
        Math.exp(-alpha * depth),
        "qaDepth",
        "exp(-qaAlpha*qaDepth)",
      ),
    ],
    "[RR,DD,CT]=p3Oblique(Z1,Z2,c,c2,theta);qaAlpha=-2*pi*f/c2*imag(CT);qaDepth=1;if qaAlpha>0,qaDepth=1/qaAlpha;end;",
    {
      answerKey: "depthAnswer",
      annotations: [xmark(depth, value("y", depth, "m")), ymark(1 / Math.E, "|p(y)|/|p(0)| = 1/e")],
    },
    {
      annotations: ["qaDepth", "1/exp(1)"],
      annotationLabels: ["sprintf('y = %.4g m',qaDepth)", "'|p(y)|/|p(0)| = 1/e'"],
    },
  );
}
export function e3611(p: Values) {
  const rays = phy.whisperRays(p.radius, p.source, p.launch),
    hit = rays[1],
    source = rays[0],
    d = Math.hypot(hit[0] - source[0], hit[1] - source[1]),
    range: [number, number] = [-p.radius, p.radius];
  return physical(
    p,
    "圆形围墙与首次撞墙声线",
    "位置 x (m)",
    "示意坐标 y (m)",
    range,
    "[-radius radius]",
    [
      points(
        value("围墙周长", 2 * pi * p.radius, "m"),
        Array.from({ length: 401 }, (_, i) => [
          p.radius * Math.cos((2 * pi * i) / 400),
          p.radius * Math.sin((2 * pi * i) / 400),
        ]),
        "radius*cos(linspace(0,2*pi,401))",
        "radius*sin(linspace(0,2*pi,401))",
      ),
      points(value("首次传播距离", d, "m"), [source, hit], "qaRays(1:2,1)'", "qaRays(1:2,2)'"),
      points("后续镜面反射声线", rays.slice(1, 6), "qaRays(2:6,1)'", "qaRays(2:6,2)'", {
        style: "--",
      }),
      dot("声源", source[0], source[1], "radius*source", "0"),
      dot("首次撞墙点", hit[0], hit[1], "qaRays(2,1)", "qaRays(2,2)", { marker: "s" }),
    ],
    "qaRays=p3Rays(radius,source,launch);",
    { equalAspect: true, ylim: [-p.radius, p.radius] },
    { ylim: "[-radius radius]", legendLocation: "northeastoutside" },
  );
}
export function e3612(p: Values) {
  const q = phy.oblique(p.Z1, p.Z2, p.c, p.c2, p.theta),
    range: [number, number] = [0, 90];
  return physical(
    p,
    "斜入射声束须按法向投影核算功率",
    "入射角 θᵢ (°)",
    "能量系数",
    range,
    "[0 90]",
    [
      line(
        "反射功率比例",
        (x) => phy.oblique(p.Z1, p.Z2, p.c, p.c2, x).r,
        range,
        "abs(p3Oblique(Z1,Z2,c,c2,x)).^2",
      ),
      line(
        "透射法向功率比例",
        (x) => phy.oblique(p.Z1, p.Z2, p.c, p.c2, x).t,
        range,
        "p3Power(Z1,Z2,c,c2,x)",
        "--",
      ),
      line("功率守恒", () => 1, range, "ones(size(x))", ":"),
      dot(value("本题透射功率系数", q.t), p.theta, q.t, "theta", "p3Power(Z1,Z2,c,c2,theta)"),
    ],
    "",
    { annotations: [xmark(p.theta, value("本题入射角", p.theta, "°"))] },
    { annotations: ["theta"] },
  );
}
export function e371(p: Values) {
  const R = phy.divide(phy.complex(p.res - 1, p.react), phy.complex(p.res + 1, p.react)),
    mag = phy.magnitude(R),
    range: [number, number] = [-1.5 * p.pa, 1.5 * p.pa];
  const ts = Array.from({ length: 401 }, (_, i) => (2 * pi * i) / 400),
    P = phy.add(phy.complex(1), R),
    U = phy.scale(phy.add(phy.complex(1), phy.scale(R, -1)), 1 / (p.rho * p.c));
  return physical(
    p,
    "复阻抗表面处压力—振速的椭圆轨迹",
    "表面声压 p (Pa)",
    "表面法向振速 u (m/s)",
    range,
    "[-1.5*pa 1.5*pa]",
    [
      points(
        value("反射模值", mag),
        ts.map((t) => [p.pa * phy.harmonic(P, t), p.pa * phy.harmonic(U, t)]),
        "pa*real((1+qaR)*exp(1i*linspace(0,2*pi,401)))",
        "pa/Z*real((1-qaR)*exp(1i*linspace(0,2*pi,401)))",
      ),
      line("纯行波参考", (x) => x / (p.rho * p.c), range, "x/Z", "--"),
    ],
    "qaR=(res-1+1i*react)/(res+1+1i*react);",
    { annotations: [ymark(0, "法向振速为零")] },
    { annotations: ["0"] },
  );
}
export function e372(p: Values) {
  const R = phy.divide(phy.complex(p.res - 1, p.react), phy.complex(p.res + 1, p.react)),
    m = phy.magnitude(R),
    range: [number, number] = [0, (2 * p.c) / p.f],
    envelope = (d: number) =>
      p.pa *
      phy.magnitude(
        phy.add(
          phy.complex(Math.cos((2 * pi * p.f * d) / p.c), Math.sin((2 * pi * p.f * d) / p.c)),
          phy.mul(
            R,
            phy.complex(Math.cos((2 * pi * p.f * d) / p.c), -Math.sin((2 * pi * p.f * d) / p.c)),
          ),
        ),
      );
  return physical(
    p,
    "阻抗管探头沿轴向扫描驻波波腹与波节",
    "距被测材料 d (m)",
    "声压包络 (Pa)",
    range,
    "[0 2*c/f]",
    [
      line("管内驻波包络", envelope, range, "pa*abs(exp(1i*k*x)+qaR*exp(-1i*k*x))"),
      line(
        value("波腹/波节比", (1 + m) / (1 - m)),
        () => p.pa * (1 + m),
        range,
        "pa*(1+abs(qaR))*ones(size(x))",
        "--",
      ),
      line(
        value("吸声系数", 1 - m * m),
        () => p.pa * (1 - m),
        range,
        "pa*(1-abs(qaR))*ones(size(x))",
        ":",
      ),
      dot(
        "可移动探头",
        p.probe,
        envelope(p.probe),
        "probe",
        "pa*abs(exp(1i*k*probe)+qaR*exp(-1i*k*probe))",
      ),
    ],
    "qaR=(res-1+1i*react)/(res+1+1i*react);",
    { annotations: [xmark(p.probe, "当前测点")] },
    { annotations: ["probe"] },
  );
}
export function e381(p: Values) {
  const range: [number, number] = [p.obs / 4, 4 * p.obs],
    u = (r: number) => (p.pa / (p.rho * p.c * r)) * Math.sqrt(1 + (p.c / (2 * pi * p.f * r)) ** 2);
  return physical(
    p,
    "点声源的球面扩展与近场振速增强",
    "距点声源 r (m)",
    "球面声压峰值 (Pa)",
    range,
    "obs*[.25 4]",
    [
      line("球面声压幅值 |A|/r", (r) => p.pa / r, range, "pa./x"),
      {
        ...line(
          value("观察点振速", u(p.obs), "m/s"),
          u,
          range,
          "pa./(Z*x).*sqrt(1+1./(k*x).^2)",
          "--",
        ),
        axis: "right",
      },
      dot("声压观察点", p.obs, p.pa / p.obs, "obs", "pa/obs"),
    ],
    "",
    { rightLabel: "球面振速峰值 (m/s)", annotations: [xmark(p.obs, "观测半径")] },
    { annotations: ["obs"] },
  );
}
export function e382(p: Values) {
  const range: [number, number] = [p.obs / 10, 5 * p.obs],
    z = (r: number) => phy.sphericalImpedance((2 * pi * p.f * r) / p.c),
    Z = p.rho * p.c;
  return physical(
    p,
    "球面波从近场波抗向远场波阻过渡",
    "距球心 r (m)",
    "局部声阻抗 (Pa·s/m)",
    range,
    "obs*[.1 5]",
    [
      line("球面波波阻", (r) => Z * z(r).re, range, "Z*(k*x).^2./(1+(k*x).^2)"),
      line("球面波波抗", (r) => Z * z(r).im, range, "Z*k*x./(1+(k*x).^2)", "--"),
      line("平面波远场极限", () => Z, range, "Z*ones(size(x))", ":"),
      dot(
        value("测点波阻", Z * z(p.obs).re, "Pa·s/m"),
        p.obs,
        Z * z(p.obs).re,
        "obs",
        "Z*(k*obs)^2/(1+(k*obs)^2)",
      ),
      dot(
        value("测点波抗", Z * z(p.obs).im, "Pa·s/m"),
        p.obs,
        Z * z(p.obs).im,
        "obs",
        "Z*k*obs/(1+(k*obs)^2)",
        { marker: "s" },
      ),
    ],
  );
}
export function e383(p: Values) {
  const range: [number, number] = [p.obs / 2, 5 * p.obs],
    v = (r: number) => p.c * (1 + (p.c / (2 * pi * p.f * r)) ** 2);
  return physical(
    p,
    "球面波声压和振速相位面的径向速度",
    "距点源 r (m)",
    "局部相速度 (m/s)",
    range,
    "obs*[.5 5]",
    [
      line(value("声压相速度", p.c, "m/s"), () => p.c, range, "c*ones(size(x))"),
      line("振速相速度", v, range, "c*(1+1./(k*x).^2)", "--"),
      dot("振速观测点", p.obs, v(p.obs), "obs", "c*(1+1/(k*obs)^2)"),
    ],
    "",
    { annotations: [xmark(p.obs, "比较位置（相速度不表示能量超声速）")] },
    { annotations: ["obs"] },
  );
}
export function e384(p: Values) {
  const range: [number, number] = [p.obs / 2, 4 * p.obs],
    power = (2 * pi * p.pa ** 2) / (p.rho * p.c),
    I = (r: number) => p.pa ** 2 / (2 * p.rho * p.c * r * r);
  return physical(
    p,
    "球面面积增加，声强减少而总声功率守恒",
    "球面半径 r (m)",
    "平均径向声强 (W/m²)",
    range,
    "obs*[.5 4]",
    [
      line("球面平均声强 ∝ 1/r²", I, range, "pa^2./(2*Z*x.^2)"),
      {
        ...line(
          value("穿过球面的声功率", power, "W"),
          () => power,
          range,
          "2*pi*pa^2/Z*ones(size(x))",
          "--",
        ),
        axis: "right",
      },
      dot("观测球面上的声强", p.obs, I(p.obs), "obs", "pa^2/(2*Z*obs^2)"),
    ],
    "",
    { rightLabel: "积分声功率 4πr²I (W)", annotations: [xmark(p.obs, "测量球面")] },
    { annotations: ["obs"] },
  );
}
export function e385(p: Values) {
  const range: [number, number] = [0, Math.max(6, 2 * p.distance)],
    k = (2 * pi * p.f) / p.c,
    s = 2 * p.boundary - 1;
  const r1 = (x: number) => Math.max(1e-6, Math.hypot(x, p.receiverDepth - p.depth)),
    r2 = (x: number) => Math.hypot(x, p.receiverDepth + p.depth);
  const amp = (x: number) =>
    p.pa *
    Math.hypot(
      Math.cos(k * r1(x)) / r1(x) + (s * Math.cos(k * r2(x))) / r2(x),
      Math.sin(k * r1(x)) / r1(x) + (s * Math.sin(k * r2(x))) / r2(x),
    );
  return physical(
    p,
    "实源与水面镜像源到接收器的干涉",
    "声源与接收器的水平间距 r (m)",
    "接收声压幅值 (Pa)",
    range,
    "[0 max(6,2*distance)]",
    [
      line(
        "直达声与反射声的合成幅值",
        amp,
        range,
        "pa*abs(exp(-1i*k*max(1e-6,sqrt(x.^2+(receiverDepth-depth)^2)))./max(1e-6,sqrt(x.^2+(receiverDepth-depth)^2))+(2*boundary-1)*exp(-1i*k*sqrt(x.^2+(receiverDepth+depth)^2))./sqrt(x.^2+(receiverDepth+depth)^2))",
      ),
      line(
        "直达声幅值",
        (x) => p.pa / r1(x),
        range,
        "pa./max(1e-6,sqrt(x.^2+(receiverDepth-depth)^2))",
        "--",
      ),
      line("镜像声幅值", (x) => p.pa / r2(x), range, "pa./sqrt(x.^2+(receiverDepth+depth)^2)", ":"),
      dot(
        value("本题路径差", r2(p.distance) - r1(p.distance), "m"),
        p.distance,
        amp(p.distance),
        "distance",
        "pa*abs(exp(-1i*k*sqrt(distance^2+(receiverDepth-depth)^2))/sqrt(distance^2+(receiverDepth-depth)^2)+(2*boundary-1)*exp(-1i*k*sqrt(distance^2+(receiverDepth+depth)^2))/sqrt(distance^2+(receiverDepth+depth)^2))",
      ),
    ],
    "",
    { annotations: [xmark(p.distance, "本题接收器")] },
    { annotations: ["distance"] },
  );
}
export function e391(p: Values) {
  const range: [number, number] = [0.1, Math.max(20, 1.5 * p.argument)],
    b = phy.cylindricalBessel(p.argument);
  return physical(
    p,
    "线声源径向方程的两支零阶柱函数",
    "径向无量纲距离 kr",
    "零阶柱函数值",
    range,
    "[.1 max(20,1.5*argument)]",
    [
      line("第一类零阶柱函数 J₀", (x) => phy.cylindricalBessel(x).J0, range, "besselj(0,x)"),
      line("第二类零阶柱函数 Y₀", (x) => phy.cylindricalBessel(x).Y0, range, "bessely(0,x)", "--"),
      dot(value("本题 J₀", b.J0), p.argument, b.J0, "argument", "besselj(0,argument)"),
      dot(value("本题 Y₀", b.Y0), p.argument, b.Y0, "argument", "bessely(0,argument)", {
        marker: "s",
      }),
    ],
  );
}
export function e392(p: Values) {
  const range: [number, number] = [p.obs / 4, 4 * p.obs],
    b = (r: number) => phy.cylindricalBessel((2 * pi * p.f * r) / p.c),
    u = (r: number) => (p.pa / (p.rho * p.c)) * Math.hypot(b(r).J1, b(r).Y1);
  return physical(
    p,
    "长线声源的柱面压力与径向振速",
    "距长线声源 r (m)",
    "柱面声压峰值 (Pa)",
    range,
    "obs*[.25 4]",
    [
      line(
        "零阶 Hankel 声压幅值",
        (r) => p.pa * Math.hypot(b(r).J0, b(r).Y0),
        range,
        "pa*abs(besselh(0,2,k*x))",
      ),
      {
        ...line("一阶 Hankel 振速幅值", u, range, "pa/Z*abs(besselh(1,2,k*x))", "--"),
        axis: "right",
      },
      dot(
        value("观测点振速", u(p.obs), "m/s"),
        p.obs,
        p.pa * Math.hypot(b(p.obs).J0, b(p.obs).Y0),
        "obs",
        "pa*abs(besselh(0,2,k*obs))",
      ),
    ],
    "",
    { rightLabel: "柱面振速峰值 (m/s)", annotations: [xmark(p.obs, "线源观测半径")] },
    { annotations: ["obs"] },
  );
}
export function e393(p: Values) {
  const range: [number, number] = [p.obs / 4, 5 * p.obs],
    Z = p.rho * p.c,
    z = (r: number) => phy.cylindricalImpedance((2 * pi * p.f * r) / p.c);
  return physical(
    p,
    "柱面波局部阻抗的实部、虚部与模值",
    "距线声源 r (m)",
    "柱面波阻抗 (Pa·s/m)",
    range,
    "obs*[.25 5]",
    [
      line(
        "柱面波波阻",
        (r) => Z * z(r).re,
        range,
        "real(1i*Z*besselh(0,2,k*x)./besselh(1,2,k*x))",
      ),
      line(
        "柱面波波抗",
        (r) => Z * z(r).im,
        range,
        "imag(1i*Z*besselh(0,2,k*x)./besselh(1,2,k*x))",
        "--",
      ),
      line(
        "柱面波阻抗模值",
        (r) => Z * phy.magnitude(z(r)),
        range,
        "abs(1i*Z*besselh(0,2,k*x)./besselh(1,2,k*x))",
        ":",
      ),
      dot(
        value("观测波阻", Z * z(p.obs).re, "Pa·s/m"),
        p.obs,
        Z * z(p.obs).re,
        "obs",
        "real(1i*Z*besselh(0,2,k*obs)/besselh(1,2,k*obs))",
      ),
      dot(
        value("观测波抗", Z * z(p.obs).im, "Pa·s/m"),
        p.obs,
        Z * z(p.obs).im,
        "obs",
        "imag(1i*Z*besselh(0,2,k*obs)/besselh(1,2,k*obs))",
        { marker: "s" },
      ),
    ],
  );
}
export function e3101(p: Values) {
  const end = Math.max(5, p.mode + 2),
    range: [number, number] = [-0.5, end + 0.5],
    ns = Array.from({ length: end + 1 }, (_, i) => i),
    fc = (p.mode * p.c) / (2 * p.h);
  return physical(
    p,
    "刚性层波导各横向阶数的截止频率阶梯",
    "横向模态阶数 n",
    "截止频率 fₙ (Hz)",
    range,
    "[-.5 max(5,mode+2)+.5]",
    [
      points(
        "各阶截止频率",
        ns.map((n) => [n, (n * p.c) / (2 * p.h)]),
        "0:max(5,mode+2)",
        "x*c/(2*h)",
        { kind: "bar" },
      ),
      dot(value("本阶横向波数", (p.mode * pi) / p.h, "rad/m"), p.mode, fc, "mode", "mode*c/(2*h)"),
    ],
    "",
    {
      integerX: true,
      annotations: [ymark(p.f, value("本题频率", p.f, "Hz")), xmark(p.mode, "本题阶数")],
    },
    { annotations: ["f", "mode"] },
  );
}
export function e3102(p: Values) {
  const range: [number, number] = [-0.5, 5.5],
    ns = [0, 1, 2, 3, 4, 5],
    pressure = p.rho * p.c * p.v0;
  return physical(
    p,
    "均匀面源只激发平面模态",
    "横向模态阶数 n",
    "激发声压幅值 (Pa)",
    range,
    "[-.5 5.5]",
    [
      points(
        "均匀源的模态声压",
        ns.map((n) => [n, n === 0 ? pressure : 0]),
        "0:5",
        "rho*c*v0*(x==0)",
        { kind: "bar" },
      ),
      {
        ...points(
          "各阶截止频率",
          ns.map((n) => [n, (n * p.c) / (2 * p.h)]),
          "0:5",
          "x*c/(2*h)",
          { marker: "s", style: "--" },
        ),
        axis: "right",
      },
      dot(value("零阶声压", pressure, "Pa"), 0, pressure, "0", "rho*c*v0"),
    ],
    "",
    {
      integerX: true,
      rightLabel: "截止频率 (Hz)",
      annotations: [xmark(1, "第一高阶 n = 1")],
    },
    { annotations: ["1"] },
  );
}
export function e3103(p: Values) {
  const fc = (p.mode * p.c) / (2 * p.h),
    range: [number, number] = [0, Math.max(2 * fc, 2 * p.f, 500)],
    alpha = Math.sqrt(Math.max(0, ((p.mode * pi) / p.h) ** 2 - ((2 * pi * p.f) / p.c) ** 2));
  return physical(
    p,
    "第二阶模式在截止前为指数衰减，截止后可传播",
    "声频率 f (Hz)",
    "轴向波数平方 k_z² (m⁻²)",
    range,
    "[0 max([2*mode*c/(2*h) 2*f 500])]",
    [
      line(
        "模态频散：k_z² = k² − kₓ²",
        (f) => ((2 * pi * f) / p.c) ** 2 - ((p.mode * pi) / p.h) ** 2,
        range,
        "(2*pi*x/c).^2-(mode*pi/h)^2",
      ),
      dot(
        value("本题衰减 α", alpha, "m⁻¹"),
        p.f,
        ((2 * pi * p.f) / p.c) ** 2 - ((p.mode * pi) / p.h) ** 2,
        "f",
        "(2*pi*f/c)^2-(mode*pi/h)^2",
      ),
    ],
    "",
    {
      annotations: [
        xmark(fc, value("本阶截止", fc, "Hz")),
        xmark(p.f, "本题频率"),
        ymark(0, "传播 / 截止的分界"),
      ],
    },
    { annotations: ["mode*c/(2*h)", "f", "0"] },
  );
}
export function e3104(p: Values) {
  const fc = (p.mode * p.c) / (2 * p.h),
    range: [number, number] = [0, Math.max(2 * p.f, 3 * fc, 500)],
    q = phy.guideMode(p.mode, p.f, p.h, p.c),
    angle = q.propagating ? (Math.asin(q.kx / q.k) * 180) / pi : NaN;
  return physical(
    p,
    "斜行平面波的横向与轴向波数分解",
    "声频率 f (Hz)",
    "波数 (rad/m)",
    range,
    "[0 max([2*f 3*mode*c/(2*h) 500])]",
    [
      line("总波数 k", (f) => (2 * pi * f) / p.c, range, "2*pi*x/c"),
      line("横向驻波波数 kₓ", () => (p.mode * pi) / p.h, range, "mode*pi/h*ones(size(x))", "--"),
      line(
        "可传播部分的轴向波数 k_z",
        (f) =>
          phy.guideMode(p.mode, f, p.h, p.c).propagating
            ? phy.guideMode(p.mode, f, p.h, p.c).kz
            : NaN,
        range,
        "p3Mask(sqrt(max(0,(2*pi*x/c).^2-(mode*pi/h)^2)),x>mode*c/(2*h))",
        ":",
      ),
      dot(
        value("本题斜行角", angle, "°"),
        p.f,
        q.propagating ? q.kz : NaN,
        "f",
        "sqrt(max(0,(2*pi*f/c)^2-(mode*pi/h)^2))",
      ),
    ],
    "",
    { annotations: [xmark(fc, value("截止频率", fc, "Hz")), xmark(p.f, "本题频率")] },
    { annotations: ["mode*c/(2*h)", "f"] },
  );
}
export function e3105(p: Values) {
  const fc = (p.mode * p.c) / (2 * p.h),
    lo = Math.max(1, fc * 1.05),
    range: [number, number] = [lo, Math.max(2 * p.f, 3 * fc, lo * 2)],
    q = phy.guideMode(p.mode, p.f, p.h, p.c);
  return physical(
    p,
    "波导中相速度与群速度互为色散补偿",
    "声频率 f (Hz)",
    "速度 (m/s)",
    range,
    "[max(1,1.05*mode*c/(2*h)) max([2*f 3*mode*c/(2*h) 2*max(1,1.05*mode*c/(2*h))])]",
    [
      line(
        "相速度 cₚ",
        (f) => phy.guideMode(p.mode, f, p.h, p.c).cp,
        range,
        "c*p3GuideSpeed(x,mode,h,c,0)",
      ),
      line(
        "群速度 c_g",
        (f) => (f > fc ? phy.guideMode(p.mode, f, p.h, p.c).cg : NaN),
        range,
        "c*p3GuideSpeed(x,mode,h,c,1)",
        "--",
      ),
      line("介质声速 c", () => p.c, range, "c*ones(size(x))", ":"),
      dot(value("本题相速度", q.cp, "m/s"), p.f, q.cp, "f", "c*p3GuideSpeed(f,mode,h,c,0)"),
      dot(value("本题群速度", q.cg, "m/s"), p.f, q.cg, "f", "c*p3GuideSpeed(f,mode,h,c,1)", {
        marker: "s",
      }),
    ],
    "",
    { annotations: [xmark(p.f, "本题工作频率")] },
    { annotations: ["f"] },
  );
}
