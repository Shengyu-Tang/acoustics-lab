import { COLORS, type Panel, fieldLimits } from "./types";
import { colorTable } from "./colormaps";
import { axisTicks } from "./ticks";
import { labelLanes } from "./layout";
const quote = (s: string) => "'" + s.replaceAll("'", "''").replace(/[\r\n]/g, " ") + "'";
const vector = (ns: number[]) =>
  "[" + ns.map((n) => (Number.isFinite(n) ? String(n) : "NaN")).join(" ") + "]";
export function matlab(panels: Panel[], rows: number, cols: number, title: string) {
  const out = [
    `% ${title.replace(/[\r\n]/g, " ")}`,
    "% Exported current data; SI units unless an axis specifies otherwise.",
    "figure('Color','w');",
  ];
  panels.forEach((original, k) => {
    const xt = axisTicks(original.xlim, original.xscale === "log"),
      yt = axisTicks(original.ylim, original.yscale === "log"),
      rt = axisTicks(original.rightLim ?? original.ylim, original.yscale === "log");
    const p =
      original.kind === "polar"
        ? original
        : { ...original, xlim: xt.limits, ylim: yt.limits, rightLim: rt.limits };
    out.push(`subplot(${rows},${cols},${k + 1});`);
    if (p.kind === "polar")
      out.push("pos=get(gca,'Position'); delete(gca); polaraxes('Position',pos);");
    out.push("hold on;");
    if (p.field) {
      const f = p.field;
      out.push(
        `im=imagesc(${vector(f.x)},${vector(f.y)},[${f.z.map((r) => r.join(" ")).join(";\n")}]);`,
        "if isprop(im,'Interpolation'), im.Interpolation='bilinear'; end",
        "set(gca,'YDir','normal');",
        `caxis(${vector(fieldLimits(f))});`,
      );
      out.push(
        `% ${f.map ?? "parula"}, identical 64 colors to browser`,
        `colormap(gca,[${colorTable(f.map)
          .map((rgb) => rgb.join(" "))
          .join(";")}]/255);`,
      );
      out.push(`cb=colorbar; ylabel(cb,${quote(f.label)});`);
    }
    p.bands?.forEach((b) =>
      out.push(
        `patch([${b.from} ${b.to} ${b.to} ${b.from}],[${p.ylim[0]} ${p.ylim[0]} ${p.ylim[1]} ${p.ylim[1]}],[.9 .9 .9],'EdgeColor','none','HandleVisibility','off');`,
      ),
    );
    p.series?.forEach((s, i) => {
      if (p.rightLabel) out.push(`yyaxis ${s.axis === "right" ? "right" : "left"};`);
      const c = s.color ?? COLORS[i % COLORS.length];
      const rgb = [1, 3, 5].map((n) => parseInt(c.slice(n, n + 2), 16) / 255);
      out.push(
        `x=${vector(s.points.map((v) => v[0]))};`,
        `y=${vector(s.points.map((v) => v[1]))};`,
      );
      const fn = p.kind === "polar" ? "polarplot" : "plot";
      const markerIndices = s.marker
        ? `, 'MarkerIndices',${vector(s.points.map((_, i) => i + 1).filter((_, i) => i % Math.max(1, Math.floor(s.points.length / 18)) === 0))}`
        : "";
      out.push(
        `${fn}(x,y,'LineStyle',${quote(s.style ?? "-")},'Marker',${quote(s.marker ?? "none")}${markerIndices},'Color',${vector(rgb)},'LineWidth',1.5,'DisplayName',${quote(s.name)});`,
      );
    });
    if (p.kind !== "polar") {
      if (p.rightLabel)
        out.push(
          "yyaxis right;",
          `ylim(${vector(p.rightLim ?? p.ylim)}); yticks(${vector(rt.values)}); ylabel(${quote(p.rightLabel)});`,
          "yyaxis left;",
        );
      out.push(
        `set(gca,'XScale',${quote(p.xscale ?? "linear")},'YScale',${quote(p.yscale ?? "linear")});`,
        `xlim(${vector(p.xlim)}); ylim(${vector(p.ylim)});`,
        `xticks(${vector(xt.values)}); yticks(${vector(yt.values)});`,
        `set(gca,'XMinorTick',${quote(p.xscale === "log" ? "on" : "off")},'YMinorTick',${quote(p.yscale === "log" ? "on" : "off")});`,
        `xlabel(${quote(p.xlabel)}); ylabel(${quote(p.ylabel)});`,
      );
      p.annotations?.forEach((a) =>
        out.push(`${a.axis}line(${a.value},'--','HandleVisibility','off');`),
      );
      const xs = (value: number) =>
        p.xscale === "log"
          ? Math.log10(value / p.xlim[0]) / Math.log10(p.xlim[1] / p.xlim[0])
          : (value - p.xlim[0]) / (p.xlim[1] - p.xlim[0]);
      labelLanes(p, 0, 536, xs).forEach((a) =>
        out.push(
          `text(${a.x / 536},${1.04 + a.lane * 0.06},${quote(a.text)},'Units','normalized','FontSize',11,'Interpreter','none','Clipping','off');`,
        ),
      );
    } else out.push(`rlim(${vector(p.ylim)});`);
    out.push(
      `title(${quote(p.title)},'Interpreter','none','FontSize',12);`,
      p.kind === "polar"
        ? "grid on; set(gca,'FontName','Arial','FontSize',11);"
        : "box on; grid on; set(gca,'FontName','Arial','FontSize',11,'TickDir','in');",
    );
    if (p.legend !== false && p.series?.length)
      out.push("legend('show','Location','best','Color','w','Box','on','Interpreter','none');");
  });
  return out.join("\n") + "\n";
}
export function csv(panels: Panel[]) {
  const q = (s: unknown) => '"' + String(s).replaceAll('"', '""') + '"';
  const rows: unknown[][] = [["panel", "series", "x", "y", "z", "x_label", "y_label"]];
  panels.forEach((p, k) => {
    p.series?.forEach((s) =>
      s.points.forEach(([x, y]) =>
        rows.push([
          k + 1,
          s.name,
          x,
          y,
          "",
          p.xlabel,
          s.axis === "right" ? p.rightLabel : p.ylabel,
        ]),
      ),
    );
    if (p.field) {
      const f = p.field;
      f.y.forEach((y, j) =>
        f.x.forEach((x, i) => rows.push([k + 1, f.label, x, y, f.z[j][i], p.xlabel, p.ylabel])),
      );
    }
  });
  return "\ufeff" + rows.map((r) => r.map(q).join(",")).join("\r\n");
}
export function download(content: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function png(svg: SVGSVGElement, name: string) {
  const source = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas"),
      box = svg.viewBox.baseVal;
    canvas.width = box.width * 2;
    canvas.height = box.height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建 PNG 画布");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG 导出失败"))), "image/png"),
    );
    download(blob, name, "image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
