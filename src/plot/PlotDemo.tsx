import { useEffect, useState } from "react";
import Header from "../Header";
import Figure, { sample, type Panel } from "./Figure";
export default function PlotDemo() {
  const [time, setTime] = useState(0),
    [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setTime((t) => (t + 0.05) % (Math.PI * 2)), 50);
    return () => clearInterval(interval);
  }, [running]);
  const base: Panel = {
    title: "plot：线型与标记",
    xlabel: "时间 t (s)",
    ylabel: "位移 x (m)",
    xlim: [0, 2 * Math.PI],
    ylim: [-1.5, 1.5],
    series: (["-", "--", ":", "-."] as const).map((style, i) => ({
      name: `曲线 ${i + 1}`,
      style,
      marker: (["o", "s", "^", "x"] as const)[i],
      points: sample((x) => Math.sin(x + i * 0.4), 0, 2 * Math.PI, 45),
    })),
    annotations: [
      { axis: "x", value: Math.PI, label: "π s" },
      { axis: "y", value: 0, label: "平衡位置" },
    ],
  };
  const logs = (x: boolean, y: boolean): Panel => ({
    ...base,
    title: x ? (y ? "loglog" : "semilogx") : "semilogy",
    xlabel: "频率 f (Hz)",
    ylabel: y ? "响应幅值 (m)" : "响应 (1)",
    xscale: x ? "log" : "linear",
    yscale: y ? "log" : "linear",
    xlim: [0.1, 100],
    ylim: y ? [0.001, 100] : [0, 3],
    series: [
      {
        name: "响应",
        points: Array.from({ length: 121 }, (_, i) => {
          const f = 10 ** (-1 + i / 40);
          return [f, y ? 1 / f : Math.log10(1 + f)];
        }),
      },
    ],
    annotations: [],
  });
  const polar: Panel = {
    ...base,
    title: "polarplot：偶极子指向性",
    xlabel: "方位角 θ (°)",
    ylabel: "归一化幅值 (1)",
    kind: "polar",
    ylim: [0, 1],
    series: [
      { name: "|cos θ|", points: sample((t) => Math.abs(Math.cos(t)), 0, 2 * Math.PI, 181) },
    ],
    annotations: [],
  };
  const x = Array.from({ length: 32 }, (_, i) => -2 + ((i + 0.5) * 4) / 32),
    y = Array.from({ length: 24 }, (_, i) => -1.5 + ((i + 0.5) * 3) / 24);
  const image = (map: "parula" | "RdBu"): Panel => ({
    title: `imagesc + colorbar (${map})`,
    xlabel: "位置 x (m)",
    ylabel: "位置 y (m)",
    xlim: [-2, 2],
    ylim: [-1.5, 1.5],
    field: {
      x,
      y,
      z: y.map((b) => x.map((a) => Math.cos(a * 3) * Math.sin(b * 3))),
      label: "声压 p (Pa)",
      map,
      limits: [-1, 1],
    },
  });
  const dual: Panel = {
    ...base,
    title: "yyaxis：双纵轴",
    rightLabel: "温度 T (°C)",
    rightLim: [0, 100],
    series: [
      { name: "位移", points: sample(Math.sin, 0, 2 * Math.PI) },
      { name: "温度", axis: "right", points: sample((t) => 50 + 30 * Math.cos(t), 0, 2 * Math.PI) },
    ],
    annotations: [],
  };
  const animation: Panel = {
    ...base,
    title: "时间动画（固定坐标轴）",
    series: [{ name: "行波", points: sample((x) => Math.sin(x - time), 0, 2 * Math.PI) }],
    annotations: [],
  };
  return (
    <>
      <Header />
      <main className="plot-demo">
        <h1>绘图组件演示</h1>
        <p>
          统一的坐标、线型、图例与数据提示。每张图可导出当前数据、PNG 和可直接运行的 MATLAB 脚本。
        </p>
        {[
          base,
          logs(true, false),
          logs(false, true),
          logs(true, true),
          polar,
          image("parula"),
          image("RdBu"),
          dual,
        ].map((p, i) => (
          <Figure
            key={i}
            panels={[p]}
            caption={`演示 ${i + 1}　${p.title}`}
            name={`demo-${i + 1}`}
          />
        ))}
        <Figure
          panels={[
            { ...base, title: "subplot(2,2,1)" },
            logs(true, false),
            logs(false, true),
            logs(true, true),
          ]}
          rows={2}
          cols={2}
          caption="演示 9　subplot(2,2,k)"
          name="demo-subplot"
        />
        <Figure
          panels={[animation]}
          caption="演示 10　播放、暂停与单步（Δt = 0.05 s）"
          name="demo-animation"
        />
        <div>
          <button onClick={() => setRunning(!running)}>{running ? "暂停" : "播放"}</button>
          <button
            onClick={() => {
              setRunning(false);
              setTime((t) => (t + 0.05) % (Math.PI * 2));
            }}
          >
            单步
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setTime(0);
            }}
          >
            复位
          </button>
          <output>t = {time.toFixed(2)} s</output>
        </div>
      </main>
    </>
  );
}
