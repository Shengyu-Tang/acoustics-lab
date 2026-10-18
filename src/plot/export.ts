import { COLORS, type Panel, type Series, fieldLimits } from "./types";
import { colorTable } from "./colormaps";
import { axisTicks } from "./ticks";
import { labelLanes } from "./layout";
import { MATLAB_FUNCTIONS } from "./matlabFunctions";
import { P4_MATLAB } from "./p4MatlabFunctions";
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
    ₐ: "a",
    ₑ: "e",
    ₒ: "o",
    ₔ: "ə",
    ₕ: "h",
    ₖ: "k",
    ₗ: "l",
    ₚ: "p",
    ₛ: "s",
    ₜ: "t",
    ᵢ: "i",
    ᵣ: "r",
    ᵧ: "y",
    ⱼ: "j",
    "₊": "+",
    "₋": "-",
    "₌": "=",
    "₍": "(",
    "₎": ")",
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
    "⁺": "+",
    "⁼": "=",
    "⁽": "(",
    "⁾": ")",
    ⁿ: "n",
    ⁱ: "i",
  };
  return text
    .replace(/⁻π/g, "^{-\\pi}")
    .replace(/([A-Za-z])\u0304/g, "\\bar{$1}")
    .replace(/[\u2080-\u209cᵢᵣᵧⱼ]+/g, (s) => "_{" + [...s].map((c) => subs[c] ?? c).join("") + "}")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]+/g, (s) => "^{" + [...s].map((c) => supers[c]).join("") + "}")
    .replace(/Δ/g, "\\Delta{}")
    .replace(/∇/g, "\\nabla ")
    .replace(/ω/g, "\\omega ")
    .replace(/θ/g, "\\theta ")
    .replace(/π/g, "\\pi ")
    .replace(/φ/g, "\\phi ")
    .replace(/×/g, "\\times ");
}
const quote = (s: string) => "'" + s.replaceAll("'", "''").replace(/[\r\n]/g, " ") + "'";
const tex = (s: string) => quote(toTex(s));
const dynamicText = (label: string, value: string | number) =>
  `sprintf(${tex(
    label
      .split(/[：:=]/)[0]
      .replace(/\s+[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*(?:s|Hz|m\/s|mm|m|W)?$/i, "")
      .replaceAll("%", "%%") + " = %.4g",
  )},${value})`;
// R2024b's TeX subset lacks \bar. Math-only labels can use LaTeX;
// Chinese prose keeps the TeX interpreter and Microsoft YaHei font.
const axisLabel = (s: string) =>
  /\\bar\{/.test(toTex(s))
    ? `${quote(toTex(s).replace(/\\bar\{([^}]+)\}/g, "$$\\bar{$1}$$"))},'Interpreter','latex'`
    : `${tex(s)},'Interpreter','tex'`;
const vector = (ns: number[]) =>
  "[" + ns.map((n) => (Number.isFinite(n) ? String(n) : "NaN")).join(" ") + "]";
export function matlab(panels: Panel[], rows: number, cols: number, title: string) {
  const model = panels.find((p) => p.matlabModel)?.matlabModel;
  const complexPlaneLegend =
    panels.length === 1 &&
    panels[0].equalAspect &&
    (panels[0].series?.filter((s) => s.legend !== false).length ?? 0) > 2 &&
    model?.setup.includes("p4");
  const out = [
    `% ${title.replace(/[\r\n]/g, " ")}`,
    ...(model
      ? [
          "% 参数块：修改后运行整个脚本即可重算；SI 单位（另注除外）。",
          ...model.parameters.map((p) => `${p.key} = ${p.value}; % ${p.comment}`),
          "% 以下为计算模型与绘图，可独立运行，无需网页。",
          `model_x=cell(${panels.length},${Math.max(1, ...panels.map((p) => p.series?.length ?? 0))}); model_y=model_x;`,
        ]
      : ["% Exported current data; SI units unless an axis specifies otherwise."]),
    "set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');",
    "set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');",
    `figure('Color','w','Position',[80 80 ${640 * cols} ${Math.max(520, ...panels.map((p) => p.matlabModel?.figureHeight ?? 520)) * rows}]);`,
  ];
  panels.forEach((original, k) => {
    const m = original.matlabModel ? { ...original.matlabModel } : undefined;
    if (m) out.push(m.setup);
    const xt = axisTicks(original.xlim, original.xscale === "log"),
      yt = axisTicks(original.ylim, original.yscale === "log"),
      rt = axisTicks(original.rightLim ?? original.ylim, original.yscale === "log");
    const p =
      original.kind === "polar"
        ? original
        : {
            ...original,
            xlim: original.exactXLimits ? original.xlim : xt.limits,
            ylim: yt.limits,
            rightLim: rt.limits,
          };
    const modelHeader = Boolean(
      m &&
      !original.annotationHeader &&
      !m.setup.includes("k=w/c; Z=rho*c;") &&
      original.annotations?.some((a) => a.axis === "x"),
    );
    if (modelHeader) p.annotationHeader = true;
    // A zero-energy log panel has no visible browser series; retain its formula
    // so changing x0/v0 in the downloaded script can create a nonzero curve.
    const plotSeries: Series[] = p.series?.length
      ? p.series
      : (m?.series.map(() => ({ name: "模型曲线", points: [], legend: false })) ?? []);
    out.push(`subplot(${rows},${cols},${k + 1});`);
    if (p.kind === "polar")
      out.push(
        "pos=get(gca,'Position');pos(2)=pos(2)+.03;pos(4)=pos(4)*.78; delete(gca); polaraxes('Position',pos);",
      );
    out.push("hold on;");
    if (p.field) {
      const f = p.field;
      out.push(
        `field_x=${m?.field?.x ?? vector(f.x)}; field_y=${m?.field?.y ?? vector(f.y)}; field_z=${m?.field?.z ?? `[${f.z.map((r) => r.join(" ")).join(";\n")}]`};`,
        `im=imagesc(field_x,field_y,field_z);`,
        ...(m ? [`model_fields{${k + 1}}=struct('x',field_x,'y',field_y,'z',field_z);`] : []),
        `if isprop(im,'Interpolation'), im.Interpolation='${f.categories ? "nearest" : "bilinear"}'; end`,
        "set(im,'HandleVisibility','off');",
        "set(gca,'YDir','normal');",
        `caxis(${m?.fieldLimits ?? vector(fieldLimits(f))});`,
      );
      out.push(
        `% ${f.map ?? "parula"}, identical 64 colors to browser`,
        `colormap(gca,[${(f.categories
          ? f.categories.map((c) => c.color.match(/[a-f0-9]{2}/gi)!.map((h) => parseInt(h, 16)))
          : colorTable(f.map)
        )
          .map((rgb) => rgb.join(" "))
          .join(";")}]/255);`,
      );
      if (f.categories)
        f.categories.forEach((c) =>
          out.push(
            `patch(NaN,NaN,[${c.color
              .match(/[a-f0-9]{2}/gi)!
              .map((h) => parseInt(h, 16))
              .join(" ")}]/255,'DisplayName',${tex(c.label)});`,
          ),
        );
      else out.push(`cb=colorbar; ylabel(cb,${tex(f.label)},'Interpreter','tex');`);
    }
    p.bands?.forEach((b, bandIndex) => {
      if (m?.ylim) out.push(`band_limits=${m.ylim};`);
      out.push(
        `patch([${m?.bands?.[bandIndex]?.from ?? b.from} ${m?.bands?.[bandIndex]?.to ?? b.to} ${m?.bands?.[bandIndex]?.to ?? b.to} ${m?.bands?.[bandIndex]?.from ?? b.from}],${m?.ylim ? "band_limits([1 1 2 2])" : `[${p.ylim[0]} ${p.ylim[0]} ${p.ylim[1]} ${p.ylim[1]}]`},[.9 .9 .9],'EdgeColor','none','HandleVisibility','off','Tag','parameterband');`,
      );
    });
    plotSeries.forEach((s, i) => {
      if (p.rightLabel) out.push(`yyaxis ${s.axis === "right" ? "right" : "left"};`);
      const c = s.color ?? COLORS[i % COLORS.length];
      const displayName = m?.legendNames?.[i] ?? tex(s.name);
      const rgb = [1, 3, 5].map((n) => parseInt(c.slice(n, n + 2), 16) / 255);
      out.push(
        `x=${m?.series[i]?.x ?? vector(s.points.map((v) => v[0]))};`,
        `y=${m?.series[i]?.y ?? vector(s.points.map((v) => v[1]))};`,
        ...(m ? [`model_x{${k + 1},${i + 1}}=x; model_y{${k + 1},${i + 1}}=y;`] : []),
      );
      const fn = p.kind === "polar" ? "polarplot" : "plot";
      if (s.kind === "barh") {
        out.push(
          `barh(y,x,0.7,'FaceColor',${vector(rgb)},'EdgeColor','k','DisplayName',${displayName});`,
        );
        return;
      }
      if (s.kind === "bar") {
        out.push(
          `bar(x,y,0.7,'FaceColor',${vector(rgb)},'EdgeColor','k','DisplayName',${displayName});`,
        );
        return;
      }
      const markerIndices = s.marker
        ? `, 'MarkerIndices',${vector(s.points.map((_, i) => i + 1).filter((_, i) => i % Math.max(1, Math.floor(s.points.length / 18)) === 0))}`
        : "";
      out.push(
        `${fn}(x,y,'LineStyle',${quote(s.style ?? "-")},'Marker',${quote(s.marker ?? "none")}${markerIndices},'Color',${vector(rgb)},'LineWidth',1.5,'DisplayName',${displayName}${s.legend === false ? ",'HandleVisibility','off'" : ""});`,
      );
    });
    if (p.schematic) {
      out.push(`xlim(${vector(p.xlim)}); ylim(${vector(p.ylim)}); daspect([1 1 1]); axis off;`);
      p.textLabels?.forEach((s) =>
        out.push(
          `text(${s.x},${s.y},${tex(s.text)},'HorizontalAlignment','center','Interpreter','tex');`,
        ),
      );
      out.push(`title(${tex(p.title)},'Interpreter','tex');`);
      out.push(`model_limits{${k + 1}}=struct('x',xlim,'y',ylim);`);
      return;
    }
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
        `xticks(${vector(p.integerX ? xt.values.filter(Number.isInteger) : xt.values)}); yticks(${vector(yt.values)});`,
        ...(p.xtickLabels
          ? [
              `xticks(${vector(p.xtickLabels.map((t) => t.value))}); xticklabels({${p.xtickLabels.map((t) => tex(t.label)).join(",")}});`,
            ]
          : []),
        ...(p.ytickLabels
          ? [
              `yticks(${vector(p.ytickLabels.map((t) => t.value))}); yticklabels({${p.ytickLabels.map((t) => tex(t.label)).join(",")}});`,
            ]
          : []),
        `set(gca,'XMinorTick',${quote(p.xscale === "log" ? "on" : "off")},'YMinorTick',${quote(p.yscale === "log" ? "on" : "off")});`,
        `xlabel(${axisLabel(p.xlabel)}); ylabel(${axisLabel(p.ylabel)});`,
      );
      const xs = (value: number) =>
        p.xscale === "log"
          ? Math.log10(value / p.xlim[0]) / Math.log10(p.xlim[1] / p.xlim[0])
          : (value - p.xlim[0]) / (p.xlim[1] - p.xlim[0]);
      // MATLAB appends recomputed numbers even to labels such as “本题频率”.
      // Reserve their width before assigning lanes, not only the prose width.
      const padding = "　000000";
      const labels = labelLanes(
        { ...p, annotations: p.annotations?.map((a) => ({ ...a, label: a.label + padding })) },
        0,
        440,
        xs,
      ).map((label, i) => ({
        ...label,
        text: label.text.endsWith(padding) ? label.text.slice(0, -padding.length) : label.text,
        ...(modelHeader ? { x: 8, lane: i } : {}),
      }));
      p.annotations?.forEach((a, ai) => {
        const value = m?.annotations?.[ai] ?? a.value;
        if (p.annotationHeader && a.axis === "x") {
          out.push(`xline(${value},'--','HandleVisibility','off');`);
          return;
        }
        const lane =
          m?.annotationLanes?.[ai] ??
          (p.staggeredAnnotations ? ai + 1 : (labels.find((l) => l.text === a.label)?.lane ?? 0));
        const dynamicLabel = a.label
          ? (m?.annotationLabels?.[ai] ??
            (m?.annotations?.[ai] && !a.label.startsWith("Qₘ=")
              ? dynamicText(a.label, value)
              : tex(a.label)))
          : "''";
        const label = lane
          ? `{${Array(lane * 2)
              .fill("' '")
              .join(";")};${dynamicLabel}}`
          : dynamicLabel;
        out.push(
          a.axis === "x"
            ? `xline(${value},'--',${label},'Interpreter','tex','LabelOrientation','horizontal','LabelVerticalAlignment','top','LabelHorizontalAlignment','${m?.annotationLabelAlignments?.[ai] ?? (xs(a.value) < 0.2 ? "right" : "left")}','HandleVisibility','off');`
            : `yline(${value},'--',${dynamicLabel},'Interpreter','tex','LabelVerticalAlignment','${a.labelPosition === "below-left" || a.value < (p.ylim[0] + p.ylim[1]) / 2 ? "bottom" : "top"}','LabelHorizontalAlignment','${a.labelPosition === "below-left" ? "left" : "right"}','HandleVisibility','off');`,
        );
      });
      if (p.annotationHeader) {
        labels.forEach((label) => {
          const ai = p.annotations?.findIndex((a) => a.label === label.text) ?? -1;
          const value = m?.annotations?.[ai];
          const text =
            m?.annotationLabels?.[ai] ??
            (value && !label.text.startsWith("Qₘ=")
              ? dynamicText(label.text, value)
              : m?.bands && label.text.startsWith("Δf")
                ? "sprintf('\\\\Delta{}f = %.4g Hz',f2-f1)"
                : tex(label.text));
          out.push(
            `text(${label.x / 440},${0.97 - label.lane * 0.12},${text},'Units','normalized','HorizontalAlignment','left','VerticalAlignment','top','BackgroundColor','w','Margin',2,'Interpreter','tex','Clipping','on');`,
          );
        });
      } else
        p.bands?.forEach((b) => {
          const lane = p.staggeredAnnotations
            ? 0
            : (labels.find((l) => l.text === b.label)?.lane ?? 0);
          out.push(
            `text(${xs((b.from + b.to) / 2)},${0.97 - lane * 0.065},${tex(b.label)},'Units','normalized','HorizontalAlignment','center','VerticalAlignment','top','Interpreter','tex','Clipping','on');`,
          );
        });
    } else {
      out.push(`rlim(${vector(p.ylim)});`);
      if (p.polarAngleLimits)
        out.push(
          `thetalim(${vector(p.polarAngleLimits)}); thetaticks(${vector([-90, -60, -30, 0, 30, 60, 90].filter((a) => a >= p.polarAngleLimits![0] && a <= p.polarAngleLimits![1]))});`,
        );
    }
    p.textLabels?.forEach((s, i) =>
      out.push(
        `text(${m?.textLabels?.[i]?.x ?? s.x},${m?.textLabels?.[i]?.y ?? s.y},${tex(s.text)},'HorizontalAlignment','center','Interpreter','tex');`,
      ),
    );
    out.push(
      p.unboundedY
        ? `title({${m?.title ?? tex(p.title)},${tex(p.responseNote ?? "解析极点处发散，超出纵轴部分省略")}},'Interpreter','tex','FontSize',12);`
        : p.responseNote && m
          ? `title({${m.title ?? tex(p.title)},${tex(p.responseNote)}},'Interpreter','tex','FontSize',12);`
          : `title(${m?.title ?? tex(p.title)},'Interpreter','tex','FontSize',12);`,
      p.kind === "polar"
        ? "grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11);"
        : "box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');",
    );
    if (
      p.legend !== false &&
      (p.field?.categories?.length || plotSeries.some((s) => s.legend !== false))
    ) {
      out.push(
        `lgd=legend('show','Location','${p.kind === "polar" ? "northeastoutside" : "best"}','Color','w','Box','on','Interpreter','tex');`,
      );
      if (original.annotationHeader)
        out.push(
          "drawnow; lgd.Units='normalized'; axpos=get(gca,'Position'); lp=lgd.Position; lp(2)=min(lp(2),axpos(2)+0.83*axpos(4)-lp(4)); lgd.Position=lp;",
        );
    }
    if (m?.amplitudeAxes || (m && p.rightLabel)) {
      // Recompute the browser's current-parameter cycle envelope after edits
      // to the downloaded parameter block. Never bake current y limits in.
      out.push("qa_left=[]; qa_right=[]; qa_time=tView;");
      if (m.envelopePeriod)
        out.push(`for qa_phase=0:127, tView=qa_phase/128*(${m.envelopePeriod});`, m.setup);
      plotSeries.forEach((s, i) => {
        if (s.style === "none" && !m.amplitudeMarkers) return;
        out.push(
          `x=${m.series[i]?.x ?? vector(s.points.map((pt) => pt[0]))}; y=${m.series[i]?.y ?? vector(s.points.map((pt) => pt[1]))};`,
          `qa_xl=${m.xlim ?? vector(p.xlim)}; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_${s.axis === "right" ? "right" : "left"}=[qa_${s.axis === "right" ? "right" : "left"} qa_y];`,
        );
      });
      if (m.envelopePeriod) out.push("end; tView=qa_time;", m.setup);
      if (m.amplitudeAxes)
        m.ylim = `qaAmplitudeLimits(qa_left,${vector(p.ylim)},${p.series?.some((s) => s.kind === "bar") ? 1 : 0},${p.yscale === "log" ? 1 : 0})`;
      if (p.rightLabel)
        m.rightLim = `currentAmplitudeLimits(qa_right,0,${p.yscale === "log" ? 1 : 0})`;
    }
    if (m && p.kind !== "polar")
      out.push(
        "% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。",
        ...(p.rightLabel
          ? [
              `yyaxis right; ylim(${m.rightLim ?? vector(p.rightLim ?? p.ylim)}); set(gca,'YTickMode','auto'); yyaxis left;`,
            ]
          : []),
        `qa_domain=${m.xlim ?? vector(p.xlim)}; xlim(${p.exactXLimits ? "qa_domain" : `qaAxisLimits(qa_domain,${p.xscale === "log" ? 1 : 0})`}); set(gca,'XTickMode','auto','YTickMode','auto');`,
        m.ylim
          ? `ylim(${m.ylim});`
          : `model_values=[${plotSeries
              .map((s, i) => (s.axis === "right" ? "" : `model_y{${k + 1},${i + 1}}`))
              .filter(Boolean)
              .join(
                " ",
              )}]; model_values=model_values(isfinite(model_values)); if ~isempty(model_values), if strcmp(get(gca,'YScale'),'log'), positive=model_values(model_values>0); if ~isempty(positive),ylim([min(positive)*.5 max(positive)*2]);end; else, lo=min(0,min(model_values)); hi=max(0,max(model_values)); pad=max((hi-lo)*${modelHeader ? String(0.3 + 0.2 * (p.annotations?.filter((a) => a.axis === "x").length ?? 0)) : p.legend === false || p.series?.every((s) => s.kind === "bar") ? ".08" : ".4"},1e-12); ylim([lo-pad hi+pad]);end;end;`,
        ...(p.integerX ? [`xticks(${vector(xt.values.filter(Number.isInteger))});`] : []),
      );
    if (p.equalAspect) out.push("daspect([1 1 1]);");
    if (p.bands?.length)
      out.push(
        "band_axes_limits=ylim;band_handles=findobj(gca,'Tag','parameterband');for band_index=1:numel(band_handles),set(band_handles(band_index),'YData',band_axes_limits([1 1 2 2]));end",
      );
    // Model headers occupy the left of the reserved top strip; keep the legend
    // in its clear right-hand area rather than letting MATLAB cover readouts.
    if (modelHeader && p.legend !== false && plotSeries.some((s) => s.legend !== false))
      out.push(`lgd.Location='${m?.legendLocation ?? "northeast"}';`);
    else if (m?.legendLocation && p.legend !== false && plotSeries.some((s) => s.legend !== false))
      out.push(`lgd.Location='${m.legendLocation}';`);
    if (complexPlaneLegend && p.legend !== false)
      out.push("lgd.Location='southoutside';lgd.FontSize=10;");
    // "best" can still cover real data. Reserve space outside every axes,
    // including models that previously requested an interior corner.
    if (
      p.legend !== false &&
      (p.field?.categories?.length || plotSeries.some((s) => s.legend !== false))
    )
      out.push(p.insetLegend ? "lgd.Location='best';" : "lgd.Location='northoutside';");
    if (p.blackAxes)
      out.push(
        "set(gca,'XColor','k'); ax=gca; for qa_axis=1:numel(ax.YAxis), ax.YAxis(qa_axis).Color='k'; end",
      );
    if (p.xtickLabels)
      out.push(
        `xticks(${vector(p.xtickLabels.map((t) => t.value))});xticklabels({${p.xtickLabels.map((t) => tex(t.label)).join(",")}});`,
      );
    if (p.ytickLabels)
      out.push(
        `${p.kind === "polar" ? "rticks" : "yticks"}(${vector(p.ytickLabels.map((t) => t.value))});${p.kind === "polar" ? "rticklabels" : "yticklabels"}({${p.ytickLabels.map((t) => tex(t.label)).join(",")}});`,
      );
    if (m)
      out.push(
        `model_limits{${k + 1}}=struct('x',${p.kind === "polar" ? "thetalim" : "xlim"},'y',${p.kind === "polar" ? "rlim" : "ylim"});`,
      );
  });
  if (model) out.push(MATLAB_FUNCTIONS);
  if (
    panels.some(
      (p) =>
        /p4[A-Z]/.test(p.matlabModel?.setup ?? "") ||
        /p4[A-Z]/.test(JSON.stringify(p.matlabModel?.series)),
    )
  )
    out.push(P4_MATLAB);
  return out.join("\n").trimEnd() + "\n";
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
