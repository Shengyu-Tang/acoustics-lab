import { useEffect, useState, useMemo } from "react";
import { result, fmt, type Values } from "./physics";
import Figure from "./plot/Figure";
import { legacyPanels } from "./plot/legacyPanels";
export default function Simulation({
  kind,
  v,
  application = false,
}: {
  kind: string;
  v: Values;
  application?: boolean;
}) {
  const [running, setRunning] = useState(true),
    [time, setTime] = useState(0);
  useEffect(() => {
    setTime(0);
  }, [kind]);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setRunning(false);
  }, []);
  useEffect(() => {
    if (!running) return;
    let frame = 0,
      last = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      if (now - last >= 50) {
        setTime((t) => (t + Math.min((now - last) / 1000, 0.1)) % 1000);
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  const panels = useMemo(() => legacyPanels(kind, v, time), [kind, v, time]);
  return (
    <div className="simulation">
      <div className="sim-toolbar">
        <span>{application ? "应用模型" : "模型演示"}</span>
        <div>
          <button
            aria-label={running ? "暂停动画" : "播放动画"}
            onClick={() => setRunning(!running)}
          >
            {running ? "暂停" : "播放"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setTime((t) => t + 0.05);
            }}
          >
            单步
          </button>
          <button onClick={() => setTime(0)}>从头播放</button>
        </div>
      </div>
      <Figure
        panels={panels}
        rows={panels.length}
        caption="模型曲线（空间动画已慢放，计算保持实际单位）"
        name={`model-${kind}`}
      />
      <div className="simulation-readouts" aria-label="实时计算结果">
        {result(kind, v).map(([label, value, unit]) => (
          <div key={label}>
            <span>{label}</span>
            <b>
              {fmt(value)} <small>{unit}</small>
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}
