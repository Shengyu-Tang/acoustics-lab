import ScriptText from "../ScriptText";
import { MathProse } from "../MathProse";
import { useLayoutEffect, useId, useMemo, useRef, useState } from "react";
import { COLORS, fieldFill, fieldColor, fieldLimits, type Panel, type Series } from "./types";
import { csv, download, matlab, png } from "./export";
export * from "./types";
export { csv, matlab } from "./export";
const DASH = { "-": "", "--": "6 4", ":": "1 3", "-.": "6 3 1 3", none: "" };
import { axisTicks, tickLabel, superscript } from "./ticks";
import { labelLanes, textWidth, textLines } from "./layout";
type Layout = { W: number; H: number; L: number; T: number; AW: number; AH: number };
const defaultLayout: Layout = { W: 640, H: 400, L: 64, T: 35, AW: 536, AH: 300 };
function polarCenter(panel: Panel, { L, T, AW, AH }: Layout) {
  const half = panel.polarAngleLimits?.[0] === -90 && panel.polarAngleLimits[1] === 90;
  return [half ? L + (AW - AH / 2) / 2 : L + AW / 2, T + AH / 2];
}
/** A small, real data preview: axis text would be unreadable at catalog size. */
export function ThumbnailAxes({ panel }: { panel: Panel }) {
  const p = {
    ...panel,
    xlim: axisTicks(panel.xlim, panel.xscale === "log").limits,
    ylim: axisTicks(panel.ylim, panel.yscale === "log").limits,
  };
  return (
    <g>
      <rect width="100" height="50" fill="white" />
      {p.field &&
        p.field.z.flatMap((row, j) =>
          row.map((z, i) => (
            <rect
              key={`${j}-${i}`}
              x={2 + (96 * i) / p.field!.x.length}
              y={2 + (46 * (p.field!.y.length - 1 - j)) / p.field!.y.length}
              width={96 / p.field!.x.length + 0.1}
              height={46 / p.field!.y.length + 0.1}
              fill={fieldFill(p.field!, z)}
            />
          )),
        )}
      {p.series?.map((series, index) => (
        <Line
          key={index}
          panel={p}
          series={series}
          index={index}
          precision={0}
          layout={{ W: 100, H: 50, L: 2, T: 2, AW: 96, AH: 46 }}
        />
      ))}
      <rect x="2" y="2" width="96" height="46" fill="none" stroke="black" strokeWidth="0.75" />
    </g>
  );
}
const number = (n: number) =>
  n === 0
    ? "0"
    : Math.abs(n) < 0.01 || Math.abs(n) >= 10000
      ? n.toExponential(1)
      : Number(n.toPrecision(4)).toString();
export const ticks = (lim: [number, number], log = false) => axisTicks(lim, log).values;
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
  layout = defaultLayout,
  precision = 3,
}: {
  series: Series;
  panel: Panel;
  index?: number;
  layout?: Layout;
  precision?: number;
}) {
  const { L, T, AW, AH } = layout;
  const [cx, cy] = polarCenter(panel, layout);
  const xs = scale(panel.xlim, panel.xscale === "log"),
    ys = scale(
      series.axis === "right" ? (panel.rightLim ?? panel.ylim) : panel.ylim,
      panel.yscale === "log",
    );
  const xy = ([x, y]: [number, number]) =>
    panel.kind === "polar"
      ? [cx + (Math.cos(x) * ys(y) * AH) / 2, cy - (Math.sin(x) * ys(y) * AH) / 2]
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
      return `${cmd}${x.toFixed(precision)},${y.toFixed(precision)}`;
    })
    .join(" ");
  const color = series.color ?? COLORS[index % COLORS.length];
  if (series.kind === "barh")
    return (
      <g data-plot-series="true" fill={color} stroke="black" strokeWidth=".5">
        {series.points.map(([x, y], i) => {
          const [px, py] = xy([x, y]),
            [base] = xy([panel.xlim[0], y]),
            h = (AH * 0.7) / (panel.ylim[1] - panel.ylim[0]);
          return (
            <rect
              key={i}
              x={Math.min(base, px)}
              y={py - h / 2}
              width={Math.abs(px - base)}
              height={h}
            />
          );
        })}
      </g>
    );
  if (series.kind === "bar")
    return (
      <g data-plot-series="true" fill={color} stroke="black" strokeWidth="0.5">
        {series.points.map(([x, y], i) => {
          const [, py] = xy([x, y]),
            base = xy([x, panel.yscale === "log" ? panel.ylim[0] : 0])[1],
            left = xy([
              panel.xscale === "log" ? Math.max(panel.xlim[0], x - 0.35) : x - 0.35,
              y,
            ])[0],
            right = xy([x + 0.35, y])[0],
            barWidth = right - left;
          return (
            <rect
              key={i}
              x={left}
              y={Math.min(py, base)}
              width={barWidth}
              height={Math.abs(base - py)}
            />
          );
        })}
      </g>
    );
  return (
    <g data-plot-series="true" fill="none" stroke={color} strokeWidth="1.5">
      {series.style !== "none" && <path d={d} strokeDasharray={DASH[series.style ?? "-"]} />}
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
export function Axes({
  panel,
  width = 640,
  height = 400,
}: {
  panel: Panel;
  width?: number;
  height?: number;
}) {
  const niceX = axisTicks(panel.xlim, panel.xscale === "log"),
    xtBase = panel.exactXLimits
      ? {
          ...niceX,
          limits: panel.xlim,
          values: niceX.values.filter((v) => v >= panel.xlim[0] && v <= panel.xlim[1]),
        }
      : niceX,
    xt = panel.xtickLabels
      ? { ...xtBase, values: panel.xtickLabels.map((t) => t.value) }
      : panel.integerX
        ? { ...xtBase, values: xtBase.values.filter(Number.isInteger) }
        : xtBase,
    yt = axisTicks(panel.ylim, panel.yscale === "log"),
    rt = axisTicks(panel.rightLim ?? panel.ylim, panel.yscale === "log");
  const p =
    panel.kind === "polar"
      ? panel
      : { ...panel, xlim: xt.limits, ylim: yt.limits, rightLim: rt.limits };
  const W = width,
    H = height;
  let L = 62,
    AW = W - L - ((p.field && !p.field.categories) || p.rightLabel ? 100 : 24);
  const labels = p.kind === "polar" ? [] : labelLanes(p, L, AW, scale(p.xlim, p.xscale === "log"));
  const legendSeries = [
    ...(p.series ?? []),
    ...(p.field?.categories ?? []).map((c) => ({
      name: c.label,
      legend: true,
      points: [],
      color: c.color,
      marker: "s" as const,
      style: "none" as const,
    })),
  ]
    .map((s, i) => ({ ...s, color: s.color ?? COLORS[i % COLORS.length] }))
    .filter((s) => s.legend !== false);
  const legendW = Math.min(
    AW - 14,
    Math.max(100, ...legendSeries.map((s) => textWidth(s.name) + 34)),
  );
  const legendEntries = legendSeries.map((s) => ({
    ...s,
    lines: textLines(s.name, Math.max(55, legendW - 28)),
  }));
  const legendH = legendEntries.reduce((sum, s) => sum + s.lines.length * 16, 8);
  const titleLines = textLines(p.title, W - 30),
    noteLines = p.responseNote ? textLines(p.responseNote, W - 30) : [];
  // Frequency readouts live above the plotting rectangle. Tight amplitude
  // limits must not force labels to cover the data on narrow screens.
  const labelTop = 20 + (titleLines.length + noteLines.length) * 16;
  const legendTop =
    labelTop + (labels.length ? (Math.max(...labels.map((a) => a.lane)) + 1) * 17 + 4 : 0);
  const T =
    p.kind === "polar"
      ? legendTop + (p.legend !== false && legendSeries.length ? legendH + 26 : 18)
      : legendTop +
        (p.legend !== false && legendSeries.length ? legendH + 6 : 0) +
        (yt.exponent || (p.rightLabel && rt.exponent) ? 18 : 0);
  let AH = p.kind === "polar" ? Math.min(AW, H - T - 66) : H - T - 66;
  if (p.equalAspect) {
    AW = Math.min(AW, (AH * (p.xlim[1] - p.xlim[0])) / (p.ylim[1] - p.ylim[0]));
    AH = (AW * (p.ylim[1] - p.ylim[0])) / (p.xlim[1] - p.xlim[0]);
    L = Math.max(62, (W - AW) / 2);
  }
  const layout = { W, H, L, T, AW, AH };
  const id = useId().replaceAll(":", ""),
    xs = scale(p.xlim, p.xscale === "log"),
    ys = scale(p.ylim, p.yscale === "log");
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const polar = p.kind === "polar";
  const halfPolar = p.polarAngleLimits?.[0] === -90 && p.polarAngleLimits[1] === 90;
  const [cx, cy] = polarCenter(p, layout);
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
        const px = polar ? cx + (Math.cos(x) * yscale(y) * AH) / 2 : L + xs(x) * AW,
          py = polar ? cy - (Math.sin(x) * yscale(y) * AH) / 2 : T + (1 - yscale(y)) * AH;
        const dist = (px - point.x) ** 2 + (py - point.y) ** 2;
        if (dist < best) {
          best = dist;
          found = {
            x: px,
            y: py,
            text: `${s.name} | X: ${number(x)}  Y: ${number(y)}`,
          };
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
    raster = useMemo(() => {
      if (!field || typeof document === "undefined") return undefined;
      const canvas = document.createElement("canvas");
      canvas.width = field.x.length;
      canvas.height = field.y.length;
      const ctx = canvas.getContext("2d")!;
      const limits = fieldLimits(field);
      field.z.forEach((row, j) =>
        row.forEach((z, i) => {
          ctx.fillStyle = fieldFill(field, z);
          ctx.fillRect(i, field.y.length - 1 - j, 1, 1);
        }),
      );
      return canvas.toDataURL();
    }, [field]),
    limits = field ? fieldLimits(field) : ([0, 1] as [number, number]);
  const legend = [L + AW - legendW, legendTop];
  return (
    <g fontFamily="Arial, Helvetica, Microsoft YaHei, sans-serif" fontSize="11" fill="#1a1a1a">
      <defs>
        <clipPath id={id}>
          <rect x={L} y={T} width={AW} height={AH} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill="white" />
      {titleLines.map((text, i) => (
        <text
          key={`title-${i}`}
          x={W / 2}
          y={17 + i * 16}
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
        >
          <ScriptText text={text} svg />
        </text>
      ))}
      {noteLines.map((text, i) => (
        <text
          key={`note-${i}`}
          x={W / 2}
          y={17 + (titleLines.length + i) * 16}
          textAnchor="middle"
          fontSize="12"
        >
          <ScriptText text={text} svg />
        </text>
      ))}
      {!polar ? (
        <>
          {xt.values.map((x) => (
            <g key={x}>
              <path d={`M${L + xs(x) * AW} ${T}v${AH}`} stroke="#e5e5e5" />
              <path d={`M${L + xs(x) * AW} ${T}v5m0 ${AH - 5}v-5`} stroke="black" />
              <text data-x-tick={x} x={L + xs(x) * AW} y={T + AH + 17} textAnchor="middle">
                <ScriptText
                  text={
                    p.xtickLabels?.find((t) => Math.abs(t.value - x) < 1e-10)?.label ??
                    tickLabel(x, xt, p.xscale === "log")
                  }
                  svg
                />
              </text>
            </g>
          ))}
          {(p.ytickLabels?.map((t) => t.value) ?? yt.values).map((y) => (
            <g key={y}>
              <path d={`M${L} ${T + (1 - ys(y)) * AH}h${AW}`} stroke="#e5e5e5" />
              <path d={`M${L} ${T + (1 - ys(y)) * AH}h5m${AW - 5} 0h-5`} stroke="black" />
              <text data-y-tick={y} x={L - 8} y={T + (1 - ys(y)) * AH + 4} textAnchor="end">
                <ScriptText
                  text={
                    p.ytickLabels?.find((t) => t.value === y)?.label ??
                    tickLabel(y, yt, p.yscale === "log")
                  }
                  svg
                />
              </text>
            </g>
          ))}
          {xt.minor.map((x) => (
            <path key={`xm${x}`} d={`M${L + xs(x) * AW} ${T}v3m0 ${AH - 3}v-3`} stroke="black" />
          ))}
          {yt.minor.map((y) => (
            <path
              key={`ym${y}`}
              d={`M${L} ${T + (1 - ys(y)) * AH}h3m${AW - 3} 0h-3`}
              stroke="black"
            />
          ))}
          {!!xt.exponent && (
            <text x={L + AW} y={T + AH + 32} textAnchor="end">
              ×10
              <ScriptText text={superscript(xt.exponent)} svg />
            </text>
          )}
          {!!yt.exponent && (
            <text x={L} y={T - 6}>
              ×10
              <ScriptText text={superscript(yt.exponent)} svg />
            </text>
          )}
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
              </g>
            ))}
            {field && raster && (
              <image
                href={raster}
                x={L + xs(field.x[0] - (field.x[1] - field.x[0]) / 2) * AW}
                y={T + (1 - ys(field.y.at(-1)! + (field.y[1] - field.y[0]) / 2)) * AH}
                width={
                  (xs(field.x.at(-1)! + (field.x[1] - field.x[0]) / 2) -
                    xs(field.x[0] - (field.x[1] - field.x[0]) / 2)) *
                  AW
                }
                height={
                  (ys(field.y.at(-1)! + (field.y[1] - field.y[0]) / 2) -
                    ys(field.y[0] - (field.y[1] - field.y[0]) / 2)) *
                  AH
                }
                preserveAspectRatio="none"
                style={{ imageRendering: field.categories ? "pixelated" : "auto" }}
              />
            )}
            {p.series?.map((s, i) => (
              <Line key={i} series={s} panel={p} index={i} layout={layout} />
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
                  </>
                ) : a.axis === "y" && y >= T && y <= T + AH ? (
                  <>
                    <path d={`M${L} ${y}h${AW}`} stroke="#555" strokeDasharray="5 4" />
                  </>
                ) : null}
              </g>
            );
          })}
          {labels.map((a, i) => (
            <g key={i}>
              {p.annotationHeader && (
                <rect
                  x={a.x - 3}
                  y={labelTop + 3 + a.lane * 17}
                  width={textWidth(a.text) + 6}
                  height={16}
                  fill="white"
                />
              )}
              <text
                key={i}
                x={a.x}
                y={labelTop + 13 + a.lane * 17}
                data-annotation-label="true"
                stroke="white"
                strokeWidth="3"
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                <ScriptText text={a.text} svg />
              </text>
            </g>
          ))}
          {p.annotations
            ?.filter((a) => a.axis === "y")
            .map((a, i) => (
              <text
                key={`y${i}`}
                x={a.labelPosition === "below-left" ? L + 5 : L + AW - 5}
                y={Math.max(
                  T + 13,
                  T + (1 - ys(a.value)) * AH + (a.labelPosition === "below-left" ? 16 : -5),
                )}
                textAnchor={a.labelPosition === "below-left" ? "start" : "end"}
                data-annotation-label="true"
                stroke="white"
                strokeWidth="3"
                paintOrder="stroke"
              >
                <ScriptText text={a.label} svg />
              </text>
            ))}
        </>
      ) : (
        <>
          {[0.25, 0.5, 0.75, 1].map((r) => (
            <g key={r}>
              <path
                d={
                  halfPolar
                    ? `M${cx} ${cy - (r * AH) / 2}a${(r * AH) / 2} ${(r * AH) / 2} 0 0 1 0 ${r * AH}`
                    : `M${cx} ${cy - (r * AH) / 2}a${(r * AH) / 2} ${(r * AH) / 2} 0 1 1 0 ${r * AH}a${(r * AH) / 2} ${(r * AH) / 2} 0 1 1 0 ${-r * AH}`
                }
                fill="none"
                stroke={r === 1 ? "black" : "#e5e5e5"}
              />
              <text x={cx + 4} y={cy - (r * AH) / 2 + 12}>
                {p.ytickLabels?.find(
                  (t) => Math.abs(t.value - (p.ylim[0] + r * (p.ylim[1] - p.ylim[0]))) < 1e-9,
                )?.label ?? number(p.ylim[0] + r * (p.ylim[1] - p.ylim[0]))}
              </text>
            </g>
          ))}
          {(halfPolar ? [-90, -60, -30, 0, 30, 60, 90] : [0, 45, 90, 135, 180, 225, 270, 315]).map(
            (a) => (
              <g key={a}>
                <path
                  d={`M${cx} ${cy}l${(Math.cos((a * Math.PI) / 180) * AH) / 2} ${(-Math.sin((a * Math.PI) / 180) * AH) / 2}`}
                  stroke="#e5e5e5"
                />
                <text
                  x={cx + Math.cos((a * Math.PI) / 180) * (AH / 2 + 14)}
                  y={cy - Math.sin((a * Math.PI) / 180) * (AH / 2 + 14) + 4}
                  textAnchor="middle"
                >
                  {a}°
                </text>
              </g>
            ),
          )}
          {p.series?.map((s, i) => (
            <Line key={i} series={s} panel={p} index={i} layout={layout} />
          ))}
        </>
      )}
      {field && !field.categories && (
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
            key="colorbar-label"
            data-axis-label="colorbar"
            x={W - 15}
            y={T + AH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${W - 15} ${T + AH / 2})`}
          >
            <ScriptText text={field.label} svg />
          </text>
        </>
      )}
      {p.rightLabel && !!rt.exponent && (
        <text x={L + AW} y={T - 6} textAnchor="end">
          ×10
          <ScriptText text={superscript(rt.exponent)} svg />
        </text>
      )}
      {p.rightLabel &&
        rt.values.map((y) => (
          <text key={y} x={L + AW + 6} y={T + (1 - scale(p.rightLim ?? p.ylim)(y)) * AH + 4}>
            <ScriptText text={tickLabel(y, rt, p.yscale === "log")} svg />
          </text>
        ))}
      {!polar && (
        <>
          <text x={L + AW / 2} y={H - 22} fontSize="12" textAnchor="middle">
            <ScriptText text={p.xlabel} svg />
          </text>
          <text
            key="left-axis-label"
            data-axis-label="left"
            x={p.equalAspect ? Math.max(15, L - 58) : 15}
            y={T + AH / 2}
            fontSize="12"
            textAnchor="middle"
            transform={`rotate(-90 ${p.equalAspect ? Math.max(15, L - 58) : 15} ${T + AH / 2})`}
          >
            <ScriptText text={p.ylabel} svg />
          </text>
        </>
      )}
      {p.rightLabel && (
        <text
          key="right-axis-label"
          data-axis-label="right"
          x={W - 15}
          y={T + AH / 2}
          fontSize="12"
          textAnchor="middle"
          transform={`rotate(-90 ${W - 15} ${T + AH / 2})`}
        >
          <ScriptText text={p.rightLabel} svg />
        </text>
      )}
      {p.legend !== false && !!legendSeries.length && (
        <g data-plot-legend="true" transform={`translate(${legend[0]} ${legend[1]})`}>
          <rect width={legendW} height={legendH} fill="white" stroke="black" strokeWidth=".5" />
          {legendEntries.map((s, i) => (
            <g
              key={i}
              transform={`translate(5 ${14 + legendEntries.slice(0, i).reduce((n, s) => n + s.lines.length * 16, 0)})`}
            >
              {s.style !== "none" && (
                <path
                  d="M0 -3h16"
                  stroke={s.color ?? COLORS[i % COLORS.length]}
                  strokeWidth="1.5"
                  strokeDasharray={DASH[s.style ?? "-"]}
                />
              )}
              {s.marker && (
                <g
                  transform="translate(8 -3)"
                  stroke={s.color ?? COLORS[i % COLORS.length]}
                  fill={p.field?.categories?.some((c) => c.label === s.name) ? s.color : "white"}
                >
                  {s.marker === "o" ? (
                    <circle r="3" />
                  ) : s.marker === "s" ? (
                    <rect x="-3" y="-3" width="6" height="6" />
                  ) : (
                    <path d={s.marker === "^" ? "M0 -4l4 7h-8Z" : "M-3 -3l6 6m-6 0l6-6"} />
                  )}
                </g>
              )}
              {s.lines.map((text, j) => (
                <text key={j} x="21" y={j * 16}>
                  <ScriptText text={text} svg />
                </text>
              ))}
            </g>
          ))}
        </g>
      )}
      <rect
        x={L}
        y={T}
        width={AW}
        height={AH}
        data-plot-area="true"
        data-x-min={p.xlim[0]}
        data-x-max={p.xlim[1]}
        data-y-min={p.ylim[0]}
        data-y-max={p.ylim[1]}
        fill="transparent"
        onPointerMove={hover}
        onPointerLeave={() => setTip(null)}
        aria-label="移动指针查看数据"
      />
      {p.textLabels?.map((s, i) => (
        <text
          key={i}
          data-free-label="true"
          x={L + xs(s.x) * AW}
          y={T + (1 - ys(s.y)) * AH}
          textAnchor="middle"
          pointerEvents="none"
        >
          <ScriptText text={s.text} svg />
        </text>
      ))}
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
            <ScriptText text={tip.text} svg />
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
    [width, setWidth] = useState(640),
    [error, setError] = useState("");
  useLayoutEffect(() => {
    const element = host.current!;
    // Measure before the first paint so mobile labels use screen-pixel sizes immediately.
    if (element.clientWidth > 0) setWidth(element.clientWidth);
    const observer = new ResizeObserver(([e]) => {
      // Hidden comparison tabs report zero; retain their last usable layout.
      if (e.contentRect.width > 0) setWidth(e.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const columns = width < 600 ? 1 : cols,
    nrows = Math.max(Math.ceil(panels.length / columns), columns === cols ? rows : 1),
    W = width / columns,
    H =
      (panels.length === 1 ? 400 : 310) +
      Math.max(
        0,
        ...panels.map((p) =>
          p.legend === false
            ? 0
            : (p.series ?? [])
                .filter((s) => s.legend !== false)
                .reduce((n, s) => n + textLines(s.name, Math.max(55, W - 222)).length * 16, 14) +
              Math.max(0, textLines(p.title, W - 30).length - 1) * 16 +
              (p.responseNote ? textLines(p.responseNote, W - 30).length * 16 : 0),
        ),
      );
  return (
    <figure ref={host} className="matlab-figure" style={{ maxWidth: cols === 1 ? 640 : undefined }}>
      <div className="figure-tools" aria-label="图形导出">
        <button
          aria-label="导出 PNG"
          onClick={async () => {
            try {
              await png(svg.current!, name + ".png");
              setError("");
            } catch (e) {
              setError(String(e));
            }
          }}
        >
          PNG
        </button>
        <span aria-hidden="true">·</span>
        <button
          aria-label="导出数据 CSV"
          onClick={() => download(csv(panels), name + ".csv", "text/csv;charset=utf-8")}
        >
          CSV
        </button>
        <span aria-hidden="true">·</span>
        <button
          aria-label="导出 MATLAB 代码"
          onClick={() =>
            download(
              matlab(panels, rows, cols, caption),
              "figure_" + name.replace(/\W/g, "_") + ".m",
              "text/plain;charset=utf-8",
            )
          }
        >
          MATLAB{panels.every((p) => p.matlabModel) ? "（可改参数）" : ""}
        </button>
      </div>
      <svg
        key={name}
        ref={svg}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${W * columns} ${H * nrows}`}
        role="img"
        aria-label={caption}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {panels.map((p, i) => (
          <g key={i} transform={`translate(${(i % columns) * W} ${Math.floor(i / columns) * H})`}>
            {/* A new axis schema gets a new SVG subtree. A former colorbar or
                yyaxis label must never be reused as a different axis label. */}
            <Axes
              key={`${name}:${i}:${p.kind}:${p.xlabel}:${p.ylabel}:${p.rightLabel ?? ""}:${p.field?.categories ? "categories" : (p.field?.label ?? "")}`}
              panel={p}
              width={W}
              height={H}
            />
          </g>
        ))}
      </svg>
      <figcaption>
        <MathProse text={caption} />
      </figcaption>
      {panels.some((p) => p.observationWindow) && (
        <p className="figure-independence">
          固定观察窗，窗外事件不显示；纵轴按当前参数的数据范围显示，播放时保持不变。
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </figure>
  );
}
