import { lazy, Suspense, useMemo, useState } from "react";
import Formula from "./Formula";
import Figure, { sample } from "./plot/Figure";
import { fmt } from "./physics";
import { NumericInput } from "./ui";
import { lensDefaults, lensPattern, residualPhase, type LensSettings } from "./lensPhysics";
const LensScene = lazy(() => import("./LensScene"));
const parameters: {
  key: keyof LensSettings;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "frequency", label: "工作频率", unit: "kHz", min: 20, max: 45, step: 1 },
  { key: "diameter", label: "等效孔径直径", unit: "cm", min: 6, max: 18, step: 1 },
  { key: "aberration", label: "基准频率下的边缘像差", unit: "rad", min: 0, max: 5, step: 0.1 },
  { key: "correction", label: "透镜补偿比例", unit: "", min: 0, max: 1.5, step: 0.05 },
  { key: "rings", label: "同心环带数量", unit: "环", min: 2, max: 24, step: 1 },
  { key: "range", label: "目标平面距离", unit: "m", min: 2, max: 50, step: 1 },
];
export default function LensLab() {
  const [v, setV] = useState<LensSettings>({ ...lensDefaults });
  const current = useMemo(() => lensPattern(v), [v]),
    before = useMemo(() => lensPattern({ ...v, correction: 0 }), [v]),
    ideal = useMemo(() => lensPattern({ ...v, correction: 1 }, true), [v]);
  const gain = 10 * Math.log10(Math.max(1e-12, current.power) / Math.max(1e-12, before.power));
  const lim = Math.max(1, ((v.aberration * v.frequency) / 30) * 1.55);
  return (
    <section className="lens-lab" aria-label="梯度声学透镜交互案例">
      <div className="lens-research">
        <h3>“65° → 16°”背后，是波前重新同相叠加。</h3>
        <p>
          报道中的导流罩使波束超过 65°；加入透镜后，在不同条件下约为
          16°–30°。研究采用钨粉—硅胶同心环带，改变局部传播速度以补偿相位。下方参数为教学设定，独立模型展示这一机理，输出由参数计算，不复刻该装置的实测曲线。
        </p>
        <a href="https://doi.org/10.1088/2631-7990/ae6b25" target="_blank" rel="noreferrer">
          研究来源：Zhang 等，IJEM（2026）· 论文与 DOI
        </a>
      </div>
      <div className="lens-presets">
        <button onClick={() => setV((a) => ({ ...a, correction: 0 }))}>① 加罩 · 不补偿</button>
        <button onClick={() => setV((a) => ({ ...a, correction: 1, rings: 12 }))}>
          ② 加入环带透镜
        </button>
        <button onClick={() => setV((a) => ({ ...a, correction: 1.4 }))}>③ 过补偿会怎样？</button>
        <button onClick={() => setV({ ...lensDefaults })}>重置透镜实验</button>
      </div>
      <div className="lens-workbench">
        <div>
          <Suspense fallback={<p>正在载入透镜场景…</p>}>
            <LensScene v={v} />
          </Suspense>
          <div className="lens-metrics" aria-live="polite">
            <div>
              <span>当前 −3 dB 全波束宽度</span>
              <b>{current.width === null ? "主瓣未闭合／离轴峰值" : fmt(current.width) + "°"}</b>
            </div>
            <div>
              <span>相对未补偿的轴向变化</span>
              <b>{fmt(gain)} dB</b>
            </div>
            <div>
              <span>相位误差 RMS（去除常量）</span>
              <b>{fmt(current.rms)} rad</b>
            </div>
            <div>
              <span>目标平面的 −3 dB 覆盖宽度</span>
              <b>{current.footprint === null ? "不适用" : fmt(current.footprint) + " m"}</b>
            </div>
          </div>
        </div>
        <div className="lens-controls">
          <h3>透镜设计工作台</h3>
          {parameters.map((p) => (
            <label key={p.key}>
              <span>
                {p.label}
                <small>{p.unit}</small>
              </span>
              <div>
                <input
                  type="range"
                  aria-label={p.label}
                  value={v[p.key]}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  onChange={(e) => setV((a) => ({ ...a, [p.key]: Number(e.target.value) }))}
                />
                <NumericInput
                  id={"lens-" + p.key}
                  aria-label={p.label + "数值"}
                  value={v[p.key]}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  onValueChange={(n) => setV((a) => ({ ...a, [p.key]: n }))}
                />
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="lens-plots">
        <Figure
          panels={[
            {
              title: "同一孔径与输入幅度下的远场声压",
              xlabel: "角度 θ (°)",
              ylabel: "归一化声压 (1)",
              xlim: [-90, 90],
              ylim: [0, 1.1],
              series: [
                {
                  name: "未补偿",
                  points: before.values.map((y, i) => [
                    -90 + (180 * i) / (before.values.length - 1),
                    y,
                  ]),
                },
                {
                  name: "理想补偿",
                  style: "--",
                  points: ideal.values.map((y, i) => [
                    -90 + (180 * i) / (ideal.values.length - 1),
                    y,
                  ]),
                },
                {
                  name: "当前透镜",
                  points: current.values.map((y, i) => [
                    -90 + (180 * i) / (current.values.length - 1),
                    y,
                  ]),
                },
              ],
            },
          ]}
          caption="同一孔径的远场声压；幅度以理想同相孔径的轴上声压为参考"
          name="lens-pattern"
        />
        <Figure
          panels={[
            {
              title: "孔径上的相位与补偿",
              xlabel: "径向位置 r/a (1)",
              ylabel: "相位 (rad)",
              xlim: [0, 1],
              ylim: [-lim, lim],
              series: [0, 1, 2].map((mode) => ({
                name: ["罩体相位", "透镜补偿", "残余相位"][mode],
                points: sample(
                  (r) => {
                    const raw = ((v.aberration * v.frequency) / 30) * r * r,
                      remaining = residualPhase(r, v);
                    return mode === 0 ? raw : mode === 1 ? remaining - raw : remaining;
                  },
                  0,
                  1,
                  241,
                ),
              })),
            },
          ]}
          caption="环带近似的相位误差与补偿"
          name="lens-phase"
        />
      </div>
      <h3>从声速分布到波束指向性</h3>
      <Formula kind="grin-lens" />
      <p className="lens-model-note">
        c = 1500 m/s，基准频率 f₀ = 30 kHz；a 为孔径半径，η 为补偿比例，qⱼ
        为环带中点的归一化半径。模型采用均匀振幅、轴对称薄相位屏与远场积分，不含导流罩真实几何、多次反射、材料损耗或混响。覆盖宽度是几何估算，不等同于双目标分辨率，也不能直接换算成探测距离。
      </p>
      <div className="project-challenge">
        <h3>先预测，再试验</h3>
        <ol>
          <li>把补偿比例从 0 调到 1：轴向声压和残余相位怎样变化？</li>
          <li>同为“完全补偿”，2 环和 24 环为什么表现不同？升高频率后差异是否更明显？</li>
          <li>用更大孔径获得更窄波束后，同一距离的照射范围怎样改变？</li>
          <li>为什么被动透镜可以提高轴向声压，却不是给系统凭空增加声功率？</li>
        </ol>
        <details>
          <summary>查看分析提示</summary>
          <p>
            补偿使孔径上各位置的辐射更接近同相，从而将能量重新分配到轴向。分环近似会留下相位误差；频率越高，同一时延误差对应的相位越大。孔径相对波长增大通常使主瓣收窄，但覆盖范围也减小。轴向声压提升不等于总声功率增加，真实装置还要考虑透射和吸收损失。
          </p>
        </details>
      </div>
    </section>
  );
}
