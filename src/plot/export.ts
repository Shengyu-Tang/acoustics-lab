import { COLORS, type Panel, fieldLimits } from "./types";
import { colorTable } from "./colormaps";
import { axisTicks } from "./ticks";
import { labelLanes } from "./layout";
/** MATLAB's TeX interpreter does not support Unicode subscript glyphs. */
export function toTex(text: string): string {
  const subs: Record<string, string> = {
    "₀": "0",
    "₁": "1",
    "₂": "2",
    "₃": "3",
    "₄": "4",
    "₅": "5",
    "₆": "6",
    "₇": "7",
    "₈": "8",
    "₉": "9",
    ₘ: "m",
    ₙ: "n",
    ₓ: "x",
  };
  const supers: Record<string, string> = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁻": "-",
  };
  return text
    .replace(/([A-Za-z])\u0304/g, "\\bar{$1}")
    .replace(/[₀-₉ₘₙₓ]+/g, (s) => "_{" + [...s].map((c) => subs[c]).join("") + "}")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (s) => "^{" + [...s].map((c) => supers[c]).join("") + "}")
    .replace(/Δ/g, "\\Delta ")
    .replace(/ω/g, "\\omega ")
    .replace(/θ/g, "\\theta ")
    .replace(/π/g, "\\pi ")
    .replace(/φ/g, "\\phi ")
    .replace(/×/g, "\\times ");
}
const quote = (s: string) => "'" + s.replaceAll("'", "''").replace(/[\r\n]/g, " ") + "'";
const tex = (s: string) => quote(toTex(s));
// R2024b's TeX subset lacks \bar. Math-only labels can use LaTeX;
// Chinese prose keeps the TeX interpreter and Microsoft YaHei font.
const axisLabel = (s: string) =>
  /\\bar\{/.test(toTex(s))
    ? `${quote(toTex(s).replace(/\\bar\{([^}]+)\}/g, "$$\\bar{$1}$$"))},'Interpreter','latex'`
    : `${tex(s)},'Interpreter','tex'`;
const vector = (ns: number[]) =>
  "[" + ns.map((n) => (Number.isFinite(n) ? String(n) : "NaN")).join(" ") + "]";
export function matlab(panels: Panel[], rows: number, cols: number, title: string) {
  const out = [
    `% ${title.replace(/[\r\n]/g, " ")}`,
    "% Exported current data; SI units unless an axis specifies otherwise.",
    "set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');",
    "set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');",
    `figure('Color','w','Position',[80 80 ${640 * cols} ${340 * rows}]);`,
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
      out.push(`cb=colorbar; ylabel(cb,${tex(f.label)},'Interpreter','tex');`);
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
        `${fn}(x,y,'LineStyle',${quote(s.style ?? "-")},'Marker',${quote(s.marker ?? "none")}${markerIndices},'Color',${vector(rgb)},'LineWidth',1.5,'DisplayName',${tex(s.name)});`,
      );
    });
    if (p.kind !== "polar") {
      if (p.rightLabel)
        out.push(
          "yyaxis right;",
          `ylim(${vector(p.rightLim ?? p.ylim)}); yticks(${vector(rt.values)}); ylabel(${tex(p.rightLabel)},'Interpreter','tex');`,
          "yyaxis left;",
        );
      out.push(
        `set(gca,'XScale',${quote(p.xscale ?? "linear")},'YScale',${quote(p.yscale ?? "linear")});`,
        `xlim(${vector(p.xlim)}); ylim(${vector(p.ylim)});`,
        `xticks(${vector(xt.values)}); yticks(${vector(yt.values)});`,
        `set(gca,'XMinorTick',${quote(p.xscale === "log" ? "on" : "off")},'YMinorTick',${quote(p.yscale === "log" ? "on" : "off")});`,
        `xlabel(${axisLabel(p.xlabel)}); ylabel(${axisLabel(p.ylabel)});`,
      );
      const xs = (value: number) =>
        p.xscale === "log"
          ? Math.log10(value / p.xlim[0]) / Math.log10(p.xlim[1] / p.xlim[0])
          : (value - p.xlim[0]) / (p.xlim[1] - p.xlim[0]);
      const labels = labelLanes(p, 0, 440, xs);
      p.annotations?.forEach((a) => {
        if (p.annotationHeader && a.axis === "x") {
          out.push(`xline(${a.value},'--','HandleVisibility','off');`);
          return;
        }
        const lane = labels.find((l) => l.text === a.label)?.lane ?? 0;
        const label = lane
          ? `{${Array(lane * 2)
              .fill("' '")
              .join(";")};${tex(a.label)}}`
          : tex(a.label);
        out.push(
          a.axis === "x"
            ? `xline(${a.value},'--',${label},'Interpreter','tex','LabelOrientation','horizontal','LabelVerticalAlignment','top','LabelHorizontalAlignment','right','HandleVisibility','off');`
            : `yline(${a.value},'--',${tex(a.label)},'Interpreter','tex','LabelVerticalAlignment','${a.labelPosition === "below-left" ? "bottom" : "top"}','LabelHorizontalAlignment','${a.labelPosition === "below-left" ? "left" : "right"}','HandleVisibility','off');`,
        );
      });
      if (p.annotationHeader) {
        labels.forEach((label) =>
          out.push(
            `text(${label.x / 440},${0.97 - label.lane * 0.065},${tex(label.text)},'Units','normalized','HorizontalAlignment','left','VerticalAlignment','top','BackgroundColor','w','Margin',2,'Interpreter','tex','Clipping','on');`,
          ),
        );
      } else
        p.bands?.forEach((b) => {
          const lane = labels.find((l) => l.text === b.label)?.lane ?? 0;
          out.push(
            `text(${xs((b.from + b.to) / 2)},${0.97 - lane * 0.065},${tex(b.label)},'Units','normalized','HorizontalAlignment','center','VerticalAlignment','top','Interpreter','tex','Clipping','on');`,
          );
        });
    } else out.push(`rlim(${vector(p.ylim)});`);
    out.push(
      `title(${tex(p.title)},'Interpreter','tex','FontSize',12);`,
      p.kind === "polar"
        ? "grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11);"
        : "box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');",
    );
    if (p.legend !== false && p.series?.length) {
      out.push(
        `lgd=legend('show','Location','${p.kind === "polar" ? "northeastoutside" : "best"}','Color','w','Box','on','Interpreter','tex');`,
      );
      if (p.annotationHeader)
        out.push(
          "drawnow; lgd.Units='normalized'; axpos=get(gca,'Position'); lp=lgd.Position; lp(2)=min(lp(2),axpos(2)+0.83*axpos(4)-lp(4)); lgd.Position=lp;",
        );
    }
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
