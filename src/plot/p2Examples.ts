import type { Values } from "../content/p1";
import { points } from "../content/p2";
import { physical, line, dot, xmark, ymark, value, grid } from "./physicalExample";
const pi = Math.PI;

export function e311(p: Values) {
  const arrival = (1000 * p.L) / p.c,
    end = arrival * 1.5,
    range: [number, number] = [0, end];
  return physical(
    p,
    "两只水下传感器与传播声程",
    "发射后时间 t (ms)",
    "波前距发射器的距离 (m)",
    range,
    "[0 1500*L/c]",
    [
      line("传播中的波前", (t) => (p.c * t) / 1000, range, "c*x/1000"),
      dot(value("接收器 L", p.L, "m"), arrival, p.L, "1000*L/c", "L"),
    ],
    "",
    {
      annotations: [
        xmark(arrival, value("首达 t", arrival, "ms")),
        ymark(p.L, value("接收距离 L", p.L, "m")),
      ],
    },
    { annotations: ["1000*L/c", "L"] },
  );
}
export function e312(p: Values) {
  const u = p.pa / (p.rho * p.c),
    xi = u / (2 * pi * p.f),
    range: [number, number] = [0, 2000 / p.f];
  return physical(
    p,
    "校准声场中同一质点的往复运动",
    "时间 t (ms)",
    "质点振速 u (m/s)",
    range,
    "[0 2000/f]",
    [
      line(
        value("振速峰值", u, "m/s"),
        (t) => u * Math.cos((2 * pi * p.f * t) / 1000),
        range,
        "pa/Z*cos(w*x/1000)",
      ),
      {
        ...line(
          value("位移峰值", xi, "m"),
          (t) => xi * Math.sin((2 * pi * p.f * t) / 1000),
          range,
          "pa/(Z*w)*sin(w*x/1000)",
          "--",
        ),
        axis: "right",
      },
      dot("振速波腹", 0, u, "0", "pa/Z"),
    ],
    "",
    { rightLabel: "质点位移 ξ (m)" },
  );
}
export function e313(p: Values) {
  const M = p.pa / (p.rho * p.c * p.c),
    dr = p.pa / (p.c * p.c),
    range: [number, number] = [0, (2 * p.c) / p.f];
  return physical(
    p,
    "工业噪声的压缩与稀疏区",
    "空间位置 x (m)",
    "密度逾量 ρ′ (kg/m³)",
    range,
    "[0 2*c/f]",
    [
      line(
        value("密度逾量峰值", dr, "kg/m³"),
        (x) => dr * Math.cos((2 * pi * p.f * x) / p.c),
        range,
        "pa/c^2*cos(k*x)",
      ),
      {
        ...line(
          value("声学马赫数峰值", M),
          (x) => M * Math.cos((2 * pi * p.f * x) / p.c),
          range,
          "pa/(rho*c^2)*cos(k*x)",
          "--",
        ),
        axis: "right",
      },
    ],
    "",
    { rightLabel: "局部声学马赫数 u/c" },
  );
}
export function e314(p: Values) {
  const range: [number, number] = [0, p.L],
    rate = (p.rho * (p.left - p.right)) / p.L;
  return physical(
    p,
    "风道体元两端流入与流出的质量通量",
    "体元轴向位置 x (m)",
    "质量流率 (kg/s)",
    range,
    "[0 L]",
    [
      line(
        "沿程质量流率",
        (x) => p.rho * p.S * (p.left + ((p.right - p.left) * x) / p.L),
        range,
        "rho*S*(left+(right-left)*x/L)",
      ),
      dot(value("入口", p.rho * p.S * p.left, "kg/s"), 0, p.rho * p.S * p.left, "0", "rho*S*left"),
      dot(
        value("出口", p.rho * p.S * p.right, "kg/s"),
        p.L,
        p.rho * p.S * p.right,
        "L",
        "rho*S*right",
      ),
    ],
    "",
    {
      annotations: [
        ymark(
          p.rho * p.S * (p.left - p.right),
          value("净流入", p.rho * p.S * (p.left - p.right), "kg/s"),
        ),
      ],
      textLabels: [
        {
          x: p.L / 2,
          y: (p.rho * p.S * (p.left + p.right)) / 2,
          text: value("∂ρ/∂t", rate, "kg/(m³·s)"),
        },
      ],
    },
    { annotations: ["rho*S*(left-right)"], textLabels: [{ x: "L/2", y: "rho*S*(left+right)/2" }] },
  );
}
export function e315(p: Values) {
  const a = (2 * pi * p.f * p.pa) / p.c ** 2,
    ratio = p.pa / (p.rho * p.c ** 2),
    range: [number, number] = [0, 1000 / p.f];
  return physical(
    p,
    "水声密度变化的一阶项与二阶修正量级",
    "时间 t (ms)",
    "一阶密度变化率 (kg/(m³·s))",
    range,
    "[0 1000/f]",
    [
      line(
        value("一阶幅值", a, "kg/(m³·s)"),
        (t) => a * Math.sin((2 * pi * p.f * t) / 1000),
        range,
        "w*pa/c^2*sin(w*x/1000)",
      ),
      {
        ...line(
          value("二阶/一阶", ratio),
          (t) => a * ratio * Math.sin((4 * pi * p.f * t) / 1000),
          range,
          "w*pa^2/(rho*c^4)*sin(2*w*x/1000)",
          "--",
        ),
        axis: "right",
      },
    ],
    "",
    { rightLabel: "二阶密度变化率量级 (kg/(m³·s))" },
  );
}
export function e316(p: Values) {
  const span = Math.max(0.02, 2 * Math.abs(p.s)),
    range: [number, number] = [-span * p.rho, span * p.rho];
  return physical(
    p,
    "绝热压缩状态曲线及小扰动切线",
    "密度逾量 ρ′ (kg/m³)",
    "声压 p (Pa)",
    range,
    "rho*[-qaSpan qaSpan]",
    [
      line(
        "绝热状态曲线",
        (x) => p.P0 * ((1 + x / p.rho) ** p.gamma - 1),
        range,
        "P0*((1+x/rho).^gamma-1)",
      ),
      line("线性切线", (x) => (p.gamma * p.P0 * x) / p.rho, range, "gamma*P0*x/rho", "--"),
      dot(
        value("本次压缩 ρ′", p.rho * p.s, "kg/m³"),
        p.rho * p.s,
        p.gamma * p.P0 * p.s,
        "rho*s",
        "gamma*P0*s",
      ),
    ],
    "qaSpan=max(.02,2*abs(s));",
  );
}
export function e317(p: Values) {
  const air = Math.sqrt(p.gamma * 287.05 * (p.T + 273.15)),
    water = Math.sqrt((p.bulk * 1e9) / p.waterRho),
    range: [number, number] = [0, 1];
  return physical(
    p,
    "空气和水中的波前经过相同传播时间",
    "传播时间 t (s)",
    "波前距离 (m)",
    range,
    "[0 1]",
    [
      line(value("空气声速", air, "m/s"), (t) => air * t, range, "sqrt(gamma*287.05*(T+273.15))*x"),
      line(
        value("水中声速", water, "m/s"),
        (t) => water * t,
        range,
        "sqrt(bulk*1e9/waterRho)*x",
        "--",
      ),
      dot("水中 1 s 波前", 1, water, "1", "sqrt(bulk*1e9/waterRho)"),
    ],
  );
}
export function e318(p: Values) {
  const k = (2 * pi * p.f) / p.c,
    a = k * p.pa,
    range: [number, number] = [0, p.c / p.f];
  return physical(
    p,
    "压力梯度驱动局部质点加速度",
    "空间位置 x (m)",
    "压力梯度 ∂p/∂x (Pa/m)",
    range,
    "[0 c/f]",
    [
      line(value("梯度幅值", a, "Pa/m"), (x) => -a * Math.sin(k * x), range, "-k*pa*sin(k*x)"),
      {
        ...line(
          value("加速度幅值", a / p.rho, "m/s²"),
          (x) => (a / p.rho) * Math.sin(k * x),
          range,
          "k*pa/rho*sin(k*x)",
          "--",
        ),
        axis: "right",
      },
    ],
    "",
    { rightLabel: "质点加速度 (m/s²)" },
  );
}
export function e321(p: Values) {
  const lag = (2 * pi * p.f * p.L) / p.c,
    range: [number, number] = [0, 2000 / p.f],
    delay = (1000 * p.L) / p.c;
  return physical(
    p,
    "相邻阵元接收的同一平面波",
    "接收时间 t (ms)",
    "声压 p (Pa)",
    range,
    "[0 2000/f]",
    [
      line(
        value("阵元 1，k", (2 * pi * p.f) / p.c, "rad/m"),
        (t) => p.pa * Math.cos((2 * pi * p.f * t) / 1000),
        range,
        "pa*cos(w*x/1000)",
      ),
      line(
        value("阵元 2，相位落后", lag, "rad"),
        (t) => p.pa * Math.cos((2 * pi * p.f * t) / 1000 - lag),
        range,
        "pa*cos(w*x/1000-k*L)",
        "--",
      ),
    ],
    "",
    { annotations: [xmark(0, "阵元 1 波峰"), xmark(delay, "阵元 2 对应波峰")] },
    { annotations: ["0", "1000*L/c"] },
  );
}
export function e322(p: Values) {
  const phi = p.pa / (p.rho * 2 * pi * p.f),
    range: [number, number] = [0, p.c / p.f];
  return physical(
    p,
    "速度势的空间梯度给出质点振速",
    "空间位置 x (m)",
    "速度势 φ (m²/s)",
    range,
    "[0 c/f]",
    [
      line(
        value("势幅值", phi, "m²/s"),
        (x) => phi * Math.cos((2 * pi * p.f * x) / p.c),
        range,
        "pa/(rho*w)*cos(k*x)",
      ),
      {
        ...line(
          value("振速幅值", p.pa / (p.rho * p.c), "m/s"),
          (x) => (-p.pa / (p.rho * p.c)) * Math.sin((2 * pi * p.f * x) / p.c),
          range,
          "-pa/Z*sin(k*x)",
          "--",
        ),
        axis: "right",
      },
      dot("势的波腹", 0, phi, "0", "pa/(rho*w)"),
    ],
    "",
    { rightLabel: "质点振速 u (m/s)" },
  );
}
export function e331(p: Values) {
  const mean = p.pa ** 2 / (4 * p.rho * p.c ** 2),
    range: [number, number] = [0, p.c / p.f];
  return physical(
    p,
    "行波动能与势能同相，总能量随波传播",
    "空间位置 x (m)",
    "能量密度 (J/m³)",
    range,
    "[0 c/f]",
    [
      line(
        "瞬时总能量密度",
        (x) => 4 * mean * Math.cos((2 * pi * p.f * x) / p.c) ** 2,
        range,
        "pa^2/(rho*c^2)*cos(k*x).^2",
      ),
      line(
        "瞬时动能密度（等于瞬时势能）",
        (x) => 2 * mean * Math.cos((2 * pi * p.f * x) / p.c) ** 2,
        range,
        "pa^2/(2*rho*c^2)*cos(k*x).^2",
        "--",
      ),
      line(
        value("平均动能", mean, "J/m³"),
        () => mean,
        range,
        "pa^2/(4*rho*c^2)*ones(size(x))",
        ":",
      ),
      dot(
        value("平均总能量", 2 * mean, "J/m³"),
        p.c / (2 * p.f),
        2 * mean,
        "c/(2*f)",
        "pa^2/(2*rho*c^2)",
      ),
    ],
  );
}
export function e332(p: Values) {
  const range: [number, number] = [0, p.L],
    power = p.S * (p.wLeft - p.wRight);
  return physical(
    p,
    "声功率沿风道体元减少并转为储能",
    "体元轴向位置 x (m)",
    "有向声能通量 (W/m²)",
    range,
    "[0 L]",
    [
      line(
        "通过截面的能量通量",
        (x) => p.wLeft + ((p.wRight - p.wLeft) * x) / p.L,
        range,
        "wLeft+(wRight-wLeft)*x/L",
      ),
      {
        ...line(
          "沿体元累计储能功率",
          (x) => (p.S * (p.wLeft - p.wRight) * x) / p.L,
          range,
          "S*(wLeft-wRight)*x/L",
          "--",
        ),
        axis: "right",
      },
      dot(value("净流入声功率", power, "W"), p.L, power, "L", "S*(wLeft-wRight)", {
        axis: "right",
      }),
    ],
    "",
    {
      answerKey: "power",
      rightLabel: "累计储能功率 (W)",
      annotations: [xmark(0, "控制体入口 x = 0"), xmark(p.L, value("控制体出口 x", p.L, "m"))],
    },
    { annotations: ["0", "L"] },
  );
}
export function e333(p: Values) {
  const phase = (p.phase * pi) / 180,
    mean = (p.pa * p.ua * Math.cos(phase)) / 2,
    range: [number, number] = [0, 2000 / p.f];
  return physical(
    p,
    "压力和振速有相位差时的瞬时能流",
    "时间 t (ms)",
    "声强 (W/m²)",
    range,
    "[0 2000/f]",
    [
      line(
        "瞬时 p(t)u(t)",
        (t) =>
          p.pa *
          p.ua *
          Math.cos((2 * pi * p.f * t) / 1000) *
          Math.cos((2 * pi * p.f * t) / 1000 - phase),
        range,
        "pa*ua*cos(w*x/1000).*cos(w*x/1000-phase*pi/180)",
      ),
      line(
        value("周期平均", mean, "W/m²"),
        () => mean,
        range,
        "pa*ua*cosd(phase)/2*ones(size(x))",
        "--",
      ),
    ],
    "",
    { annotations: [ymark(mean, value("平均声强", mean, "W/m²"))] },
    { annotations: ["pa*ua*cosd(phase)/2"] },
  );
}
export function e341(p: Values) {
  const range: [number, number] = [0, (2 * p.c) / p.f],
    net = (p.pa ** 2 - p.B ** 2) / (2 * p.rho * p.c);
  return physical(
    p,
    "风道内前进波、后退波及合成包络",
    "风道位置 x (m)",
    "声压 (Pa)",
    range,
    "[0 2*c/f]",
    [
      line(
        "合成声压包络",
        (x) =>
          Math.sqrt(p.pa ** 2 + p.B ** 2 + 2 * p.pa * p.B * Math.cos((4 * pi * p.f * x) / p.c)),
        range,
        "sqrt(pa^2+B^2+2*pa*B*cos(2*k*x))",
      ),
      line(
        "前进波 t=0",
        (x) => p.pa * Math.cos((2 * pi * p.f * x) / p.c),
        range,
        "pa*cos(k*x)",
        "--",
      ),
      line("后退波 t=0", (x) => p.B * Math.cos((2 * pi * p.f * x) / p.c), range, "B*cos(k*x)", ":"),
    ],
    "",
    {
      annotations: [ymark(p.pa + p.B, value("最大包络", p.pa + p.B, "Pa"))],
      textLabels: [{ x: p.c / p.f, y: -p.pa * 0.7, text: value("净声强", net, "W/m²") }],
    },
    { annotations: ["pa+B"], textLabels: [{ x: "c/f", y: "-.7*pa" }] },
  );
}
export function e342(p: Values) {
  const range: [number, number] = [0, (2 * p.c) / p.f];
  return physical(
    p,
    "经过四分之一周期，波形平移四分之一波长",
    "空间位置 x (m)",
    "声压 (Pa)",
    range,
    "[0 2*c/f]",
    [
      line("t = 0", (x) => p.pa * Math.cos((2 * pi * p.f * x) / p.c), range, "pa*cos(k*x)"),
      line(
        value("t = T/4", 250 / p.f, "ms"),
        (x) => p.pa * Math.sin((2 * pi * p.f * x) / p.c),
        range,
        "pa*sin(k*x)",
        "--",
      ),
      dot("下一个同相波峰", p.c / p.f, p.pa, "c/f", "pa"),
    ],
    "",
    {
      annotations: [xmark(0, "起始波峰 x = 0 m"), xmark(p.c / p.f, value("λ", p.c / p.f, "m"))],
    },
    { annotations: ["0", "c/f"] },
  );
}
export function e343(p: Values) {
  const u = p.pa / (p.rho * p.c),
    range: [number, number] = [-p.pa, p.pa];
  return physical(
    p,
    "水听器和振速探头的同相校准轨迹",
    "一个周期内的声压 p (Pa)",
    "振速 u (m/s)",
    range,
    "[-pa pa]",
    [
      line("行波压力—振速轨迹", (x) => x / (p.rho * p.c), range, "x/Z"),
      dot(value("振速峰值", u, "m/s"), p.pa, u, "pa", "pa/Z"),
    ],
    "",
    { annotations: [ymark(0, "振速为零")] },
    { annotations: ["0"] },
  );
}
export function e344(p: Values) {
  const I = p.pa ** 2 / (2 * p.rho * p.c),
    range: [number, number] = [0, 1000 / p.f];
  return physical(
    p,
    "水中定幅行波的功率流随时间振荡",
    "时间 t (ms)",
    "声能通量 (W/m²)",
    range,
    "[0 1000/f]",
    [
      line(
        "瞬时声强",
        (t) => 2 * I * Math.cos((2 * pi * p.f * t) / 1000) ** 2,
        range,
        "pa^2/Z*cos(w*x/1000).^2",
      ),
      line(value("平均声强", I, "W/m²"), () => I, range, "pa^2/(2*Z)*ones(size(x))", "--"),
      dot(value("特性阻抗", p.rho * p.c, "Pa·s/m"), 500 / p.f, I, "500/f", "pa^2/(2*Z)"),
    ],
  );
}
export function e345(p: Values) {
  const arrival = (1000 * p.L) / p.c,
    end = arrival + 2 * p.duration,
    range: [number, number] = [0, end];
  const pulse = (t: number) =>
    t >= 0 && t <= p.duration ? p.pa * Math.sin((pi * t) / p.duration) : 0;
  return physical(
    p,
    "有限时宽脉冲的发射及延迟接收",
    "时间 t (ms)",
    "脉冲声压 (Pa)",
    range,
    "[0 1000*L/c+2*duration]",
    [
      line("发射器", pulse, range, "pa*sin(pi*x/duration).*(x>=0 & x<=duration)"),
      line(
        "接收器",
        (t) => pulse(t - arrival),
        range,
        "pa*sin(pi*(x-1000*L/c)/duration).*(x>=1000*L/c & x<=1000*L/c+duration)",
        "--",
      ),
    ],
    "",
    {
      answerKey: "arrival",
      annotations: [
        xmark(arrival, value("首达", arrival, "ms")),
        xmark(arrival + p.duration, value("接收脉冲尾沿时刻", arrival + p.duration, "ms")),
      ],
    },
    { annotations: ["1000*L/c", "1000*L/c+duration"] },
  );
}
export function e346(p: Values) {
  const count = Math.max(1, Math.round(p.n)),
    single = (20e-6 * 10 ** (p.sourceLevel / 20)) ** 2,
    range: [number, number] = [0.5, count + 0.5];
  const index = Array.from({ length: count }, (_, i) => i + 1);
  return physical(
    p,
    "非相干设备相加的是均方声压",
    "设备序号 n",
    "均方声压 (Pa²)",
    range,
    "[.5 n+.5]",
    [
      points(
        "每台设备的均方贡献",
        index.map((x) => [x, single]),
        "1:n",
        "(20e-6*10^(sourceLevel/20))^2*ones(size(x))",
        { kind: "bar" },
      ),
      points(
        "累计均方声压",
        index.map((x) => [x, x * single]),
        "1:n",
        "x*(20e-6*10^(sourceLevel/20))^2",
        { marker: "s" },
      ),
      points(
        "累计有效声压",
        index.map((x) => [x, Math.sqrt(x * single)]),
        "1:n",
        "sqrt(x)*(20e-6*10^(sourceLevel/20))",
        { axis: "right", style: "--" },
      ),
      dot(
        value("合成有效声压", Math.sqrt(count * single), "Pa"),
        count,
        Math.sqrt(count * single),
        "n",
        "sqrt(n)*(20e-6*10^(sourceLevel/20))",
        { axis: "right" },
      ),
    ],
    "",
    {
      answerKey: "rms",
      rightLabel: "有效声压 (Pa)",
      integerX: true,
      annotations: [ymark(count * single, value("合成声压方均值", count * single, "Pa²"))],
    },
    { annotations: ["n*(20e-6*10^(sourceLevel/20))^2"] },
  );
}
export function e351(p: Values) {
  const alpha = ((2 * pi * p.f) / p.c) * Math.sqrt(p.ratio ** 2 - 1),
    range: [number, number] = [0, Math.max(4 / alpha, p.depth * 1.5)];
  return physical(
    p,
    "近场空间分量离开激励面的指数衰减",
    "离激励面深度 z (m)",
    "相对声压幅值 |p|/|p₀|",
    range,
    "[0 max(4/alpha,1.5*depth)]",
    [
      line(value("衰减系数 α", alpha, "m⁻¹"), (z) => Math.exp(-alpha * z), range, "exp(-alpha*x)"),
      line("同频传播波的幅值参照", () => 1, range, "ones(size(x))", "--"),
      dot(
        value("观察点相对幅值", Math.exp(-alpha * p.depth)),
        p.depth,
        Math.exp(-alpha * p.depth),
        "depth",
        "exp(-alpha*depth)",
      ),
    ],
    "alpha=k*sqrt(ratio^2-1);",
    { annotations: [xmark(p.depth, "近场观察深度")] },
    { annotations: ["depth"] },
  );
}
export function e352(p: Values) {
  const k = (2 * pi * p.f) / p.c,
    kx = k * Math.cos((p.elevation * pi) / 180) * Math.cos((p.azimuth * pi) / 180),
    ky = k * Math.cos((p.elevation * pi) / 180) * Math.sin((p.azimuth * pi) / 180),
    range: [number, number] = [-k, k];
  return physical(
    p,
    "三维波矢在水平阵列平面上的投影",
    "波数分量 kₓ (rad/m)",
    "波数分量 kᵧ (rad/m)",
    range,
    "[-k k]",
    [
      points(
        value("波矢模长 k", k, "rad/m"),
        [
          [0, 0],
          [kx, ky],
        ],
        "[0 k*cosd(elevation)*cosd(azimuth)]",
        "[0 k*cosd(elevation)*sind(azimuth)]",
      ),
      points(
        value("x 轴投影", kx, "rad/m"),
        [
          [0, 0],
          [kx, 0],
          [kx, ky],
        ],
        "[0 k*cosd(elevation)*cosd(azimuth) k*cosd(elevation)*cosd(azimuth)]",
        "[0 0 k*cosd(elevation)*sind(azimuth)]",
        { style: "--" },
      ),
      dot(
        "波矢投影终点",
        kx,
        ky,
        "k*cosd(elevation)*cosd(azimuth)",
        "k*cosd(elevation)*sind(azimuth)",
      ),
    ],
    "",
    { equalAspect: true, ylim: [-k, k] },
    { ylim: "[-k k]" },
  );
}
