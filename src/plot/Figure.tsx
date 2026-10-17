import { useEffect, useId, useRef, useState } from "react";
import { COLORS, fieldColor, fieldLimits, type Panel, type Series } from "./types";
import { csv, download, matlab, png } from "./export";
export * from "./types";
export { csv, matlab } from "./export";
const DASH = { "-": "", "--": "6 4", ":": "1 3", "-.": "6 3 1 3" };
const W = 400,
  H = 300,
  L = 66,
  T = 35,
  AW = 275,
  AH = 205;
const number = (n: number) =>
  n === 0
    ? "0"
    : Math.abs(n) < 0.01 || Math.abs(n) >= 10000
      ? n.toExponential(1)
      : Number(n.toPrecision(4)).toString();
export function ticks(lim: [number, number], log = false) {
  if (log) {
    const a = [];
    for (let e = Math.ceil(Math.log10(lim[0])); e <= Math.floor(Math.log10(lim[1])); e++)
      a.push(10 ** e);
    return a.length ? a : lim;
  }
  return Array.from({ length: 5 }, (_, i) => lim[0] + ((lim[1] - lim[0]) * i) / 4);
}
function scale(lim: [number, number], log = false) {
  return (v: number) =>
    log
      ? (Math.log10(v) - Math.log10(lim[0])) / (Math.log10(lim[1]) - Math.log10(lim[0]))
      : (v - lim[0]) / (lim[1] - lim[0]);
}
export function Line({
  series,
  panel,
  index = 0,
}: {
  series: Series;
  panel: Panel;
  index?: number;
}) {
  const xs = scale(panel.xlim, panel.xscale === "log"),
    ys = scale(
      series.axis === "right" ? (panel.rightLim ?? panel.ylim) : panel.ylim,
      panel.yscale === "log",
    );
  const xy = ([x, y]: [number, number]) =>
    panel.kind === "polar"
      ? [L + AW / 2 + (Math.cos(x) * ys(y) * AH) / 2, T + AH / 2 - (Math.sin(x) * ys(y) * AH) / 2]
      : [L + xs(x) * AW, T + (1 - ys(y)) * AH];
  let active = false;
  const d = series.points
    .map((p) => {
      const [x, y] = xy(p);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        active = false;
        return "";
      }
      const cmd = active ? "L" : "M";
      active = true;
      return `${cmd}${x.toFixed(3)},${y.toFixed(3)}`;
    })
    .join(" ");
  const color = series.color ?? COLORS[index % COLORS.length];
  return (
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path d={d} strokeDasharray={DASH[series.style ?? "-"]} />
      {series.marker &&
        series.points
          .filter((_, i) => i % Math.max(1, Math.floor(series.points.length / 18)) === 0)
          .map((p, i) => {
            const [x, y] = xy(p);
            if (!Number.isFinite(x + y)) return null;
            return series.marker === "o" ? (
              <circle key={i} cx={x} cy={y} r="3" fill="white" />
            ) : series.marker === "s" ? (
              <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill="white" />
            ) : (
              <path
                key={i}
                d={
                  series.marker === "^"
                    ? `M${x} ${y - 4}l4 7h-8Z`
                    : `M${x - 3} ${y - 3}l6 6m-6 0l6-6`
                }
              />
            );
          })}
    </g>
  );
}
export function Axes({ panel: p }: { panel: Panel }) {
  const id = useId().replaceAll(":", ""),
    xs = scale(p.xlim, p.xscale === "log"),
    ys = scale(p.ylim, p.yscale === "log");
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const polar = p.kind === "polar";
  function hover(e: React.PointerEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement!,
      pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = pt.matrixTransform(matrix.inverse());
    let best = Infinity,
      found: { x: number; y: number; text: string } | null = null;
    p.series?.forEach((s) =>
      s.points.forEach(([x, y]) => {
        const yscale = scale(
          s.axis === "right" ? (p.rightLim ?? p.ylim) : p.ylim,
          p.yscale === "log",
        );
        const px = polar ? L + AW / 2 + (Math.cos(x) * yscale(y) * AH) / 2 : L + xs(x) * AW,
          py = polar ? T + AH / 2 - (Math.sin(x) * yscale(y) * AH) / 2 : T + (1 - yscale(y)) * AH;
        const dist = (px - point.x) ** 2 + (py - point.y) ** 2;
        if (dist < best) {
          best = dist;
          found = { x: px, y: py, text: `${s.name} | X: ${number(x)}  Y: ${number(y)}` };
        }
      }),
    );
    if (p.field) {
      const f = p.field,
        x = p.xlim[0] + ((point.x - L) / AW) * (p.xlim[1] - p.xlim[0]),
        y = p.ylim[0] + (1 - (point.y - T) / AH) * (p.ylim[1] - p.ylim[0]);
      const i = f.x.reduce((a, v, i) => (Math.abs(v - x) < Math.abs(f.x[a] - x) ? i : a), 0),
        j = f.y.reduce((a, v, j) => (Math.abs(v - y) < Math.abs(f.y[a] - y) ? j : a), 0);
      found = {
        x: point.x,
        y: point.y,
        text: `X: ${number(f.x[i])} Y: ${number(f.y[j])} Z: ${number(f.z[j][i])}`,
      };
    }
    setTip(found);
  }
  const field = p.field,
    limits = field ? fieldLimits(field) : ([0, 1] as [number, number]);
  return (
    <g fontFamily="Arial, Helvetica, Microsoft YaHei, sans-serif" fontSize="11" fill="#1a1a1a">
      <defs>
        <clipPath id={id}>
          <rect x={L} y={T} width={AW} height={AH} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill="white" />
      <text x={L + AW / 2} y="17" fontSize="12" fontWeight="bold" textAnchor="middle">
        {p.title}
      </text>
      {!polar ? (
        <>
          {ticks(p.xlim, p.xscale === "log").map((x) => (
            <g key={x}>
              <path d={`M${L + xs(x) * AW} ${T}v${AH}`} stroke="#e5e5e5" />
              <path d={`M${L + xs(x) * AW} ${T}v5m0 ${AH - 5}v-5`} stroke="black" />
              <text x={L + xs(x) * AW} y={T + AH + 17} textAnchor="middle">
                {number(x)}
              </text>
            </g>
          ))}
          {ticks(p.ylim, p.yscale === "log").map((y) => (
            <g key={y}>
              <path d={`M${L} ${T + (1 - ys(y)) * AH}h${AW}`} stroke="#e5e5e5" />
              <path d={`M${L} ${T + (1 - ys(y)) * AH}h5m${AW - 5} 0h-5`} stroke="black" />
              <text x={L - 8} y={T + (1 - ys(y)) * AH + 4} textAnchor="end">
                {number(y)}
              </text>
            </g>
          ))}
          <g clipPath={`url(#${id})`}>
            {p.bands?.map((b, i) => (
              <g key={i}>
                <rect
                  x={L + xs(b.from) * AW}
                  y={T}
                  width={(xs(b.to) - xs(b.from)) * AW}
                  height={AH}
                  fill="#eee"
                />
                <text x={L + xs(b.from) * AW + 3} y={T + AH - 8}>
                  {b.label}
                </text>
              </g>
            ))}
            {field &&
              field.z.map((row, j) =>
                row.map((z, i) => {
                  const dx = (p.xlim[1] - p.xlim[0]) / field.x.length,
                    dy = (p.ylim[1] - p.ylim[0]) / field.y.length;
                  return (
                    <rect
                      key={`${i}-${j}`}
                      x={L + xs(field.x[i] - dx / 2) * AW}
                      y={T + (1 - ys(field.y[j] + dy / 2)) * AH}
                      width={AW / field.x.length + 0.5}
                      height={AH / field.y.length + 0.5}
                      fill={fieldColor(z, limits, field.map)}
                    />
                  );
                }),
              )}
            {p.series?.map((s, i) => (
              <Line key={i} series={s} panel={p} index={i} />
            ))}
          </g>
          <rect x={L} y={T} width={AW} height={AH} stroke="black" strokeWidth=".75" fill="none" />
          {p.annotations?.map((a, i) => {
            const x = L + xs(a.value) * AW,
              y = T + (1 - ys(a.value)) * AH;
            return (
              <g key={i}>
                {a.axis === "x" && x >= L && x <= L + AW ? (
                  <>
                    <path d={`M${x} ${T}v${AH}`} stroke="#555" strokeDasharray="5 4" />
                    <text
                      x={x + 4}
                      y={T + AH * (a.labelY ?? 0.5)}
                      transform={`rotate(-90 ${x + 4} ${T + AH * (a.labelY ?? 0.5)})`}
                    >
                      {a.label}
                    </text>
                  </>
                ) : a.axis === "y" && y >= T && y <= T + AH ? (
                  <>
                    <path d={`M${L} ${y}h${AW}`} stroke="#555" strokeDasharray="5 4" />
                    <text x={L + 4} y={y - 5}>
                      {a.label}
                    </text>
                  </>
                ) : null}
              </g>
            );
          })}
        </>
      ) : (
        <>
          {[0.25, 0.5, 0.75, 1].map((r) => (
            <g key={r}>
              <circle
                cx={L + AW / 2}
                cy={T + AH / 2}
                r={(r * AH) / 2}
                fill="none"
                stroke={r === 1 ? "black" : "#e5e5e5"}
              />
              <text x={L + AW / 2 + 4} y={T + AH / 2 - (r * AH) / 2 + 12}>
                {number(p.ylim[0] + r * (p.ylim[1] - p.ylim[0]))}
              </text>
            </g>
          ))}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <g key={a}>
              <path
                d={`M${L + AW / 2} ${T + AH / 2}l${(Math.cos((a * Math.PI) / 180) * AH) / 2} ${(-Math.sin((a * Math.PI) / 180) * AH) / 2}`}
                stroke="#e5e5e5"
              />
              <text
                x={L + AW / 2 + Math.cos((a * Math.PI) / 180) * (AH / 2 + 8)}
                y={T + AH / 2 - Math.sin((a * Math.PI) / 180) * (AH / 2 + 8) + 4}
                textAnchor="middle"
              >
                {a}°
              </text>
            </g>
          ))}
          {p.series?.map((s, i) => (
            <Line key={i} series={s} panel={p} index={i} />
          ))}
        </>
      )}
      {field && (
        <>
          {Array.from({ length: 64 }, (_, i) => (
            <rect
              key={i}
              x={L + AW + 10}
              y={T + ((63 - i) * AH) / 64}
              width="10"
              height={AH / 64 + 0.4}
              fill={fieldColor(limits[0] + (i / 63) * (limits[1] - limits[0]), limits, field.map)}
            />
          ))}
          <text x={L + AW + 22} y={T + 5}>
            {number(limits[1])}
          </text>
          <text x={L + AW + 22} y={T + AH}>
            {number(limits[0])}
          </text>
          <text
            x={W - 2}
            y={T + AH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${W - 2} ${T + AH / 2})`}
          >
            {field.label}
          </text>
        </>
      )}
      {p.rightLabel &&
        ticks(p.rightLim ?? p.ylim).map((y) => (
          <text key={y} x={L + AW + 6} y={T + (1 - scale(p.rightLim ?? p.ylim)(y)) * AH + 4}>
            {number(y)}
          </text>
        ))}
      <text x={L + AW / 2} y={H - 22} fontSize="12" textAnchor="middle">
        {p.xlabel}
      </text>
      <text
        x="15"
        y={T + AH / 2}
        fontSize="12"
        textAnchor="middle"
        transform={`rotate(-90 15 ${T + AH / 2})`}
      >
        {p.ylabel}
      </text>
      {p.rightLabel && (
        <text
          x={W - 3}
          y={T + AH / 2}
          fontSize="12"
          textAnchor="middle"
          transform={`rotate(-90 ${W - 3} ${T + AH / 2})`}
        >
          {p.rightLabel}
        </text>
      )}
      {p.legend !== false && !!p.series?.length && (
        <g transform={`translate(${L + AW - 132} ${T + 8})`}>
          <rect
            width="125"
            height={p.series.length * 16 + 8}
            fill="white"
            stroke="black"
            strokeWidth=".5"
          />
          {p.series.map((s, i) => (
            <g key={i} transform={`translate(5 ${14 + i * 16})`}>
              <path
                d="M0 -3h16"
                stroke={s.color ?? COLORS[i % COLORS.length]}
                strokeWidth="1.5"
                strokeDasharray={DASH[s.style ?? "-"]}
              />
              <text x="21">{s.name}</text>
            </g>
          ))}
        </g>
      )}
      <rect
        x={L}
        y={T}
        width={AW}
        height={AH}
        fill="transparent"
        onPointerMove={hover}
        onPointerLeave={() => setTip(null)}
        aria-label="移动指针查看数据"
      />
      {tip && (
        <g pointerEvents="none">
          <circle cx={tip.x} cy={tip.y} r="3" fill="black" />
          <rect
            x={L}
            y={H - 15}
            width={AW}
            height="15"
            fill="#fffde7"
            stroke="#555"
            strokeWidth=".5"
          />
          <text x={L + 4} y={H - 4} fontSize="10">
            {tip.text}
          </text>
        </g>
      )}
    </g>
  );
}
export default function Figure({
  panels,
  rows = 1,
  cols = 1,
  caption,
  name = "figure",
}: {
  panels: Panel[];
  rows?: number;
  cols?: number;
  caption: string;
  name?: string;
}) {
  const host = useRef<HTMLElement>(null),
    svg = useRef<SVGSVGElement>(null),
    [narrow, setNarrow] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const observer = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 600));
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, []);
  const columns = narrow ? 1 : cols,
    nrows = Math.max(Math.ceil(panels.length / columns), narrow ? 1 : rows);
  return (
    <figure ref={host} className="matlab-figure">
      <div className="figure-tools" aria-label="图形导出">
        <button
          onClick={async () => {
            try {
              await png(svg.current!, name + ".png");
              setError("");
            } catch (e) {
              setError(String(e));
            }
          }}
        >
          导出 PNG
        </button>
        <button onClick={() => download(csv(panels), name + ".csv", "text/csv;charset=utf-8")}>
          导出数据 CSV
        </button>
        <button
          onClick={() =>
            download(matlab(panels, rows, cols, caption), name + ".m", "text/plain;charset=utf-8")
          }
        >
          导出 MATLAB 代码
        </button>
      </div>
      <svg
        ref={svg}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${W * columns} ${H * nrows}`}
        role="img"
        aria-label={caption}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {panels.map((p, i) => (
          <g key={i} transform={`translate(${(i % columns) * W} ${Math.floor(i / columns) * H})`}>
            <Axes panel={p} />
          </g>
        ))}
      </svg>
      <figcaption>{caption}</figcaption>
      {error && <p role="alert">{error}</p>}
    </figure>
  );
}
