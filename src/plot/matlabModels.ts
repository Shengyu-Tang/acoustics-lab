import type { MatlabModel, Panel } from "./types";
import type { ParameterDefinition } from "../Parameter";
type Values = Record<string, number>;
type Curve = { x: string; y: string };
const curve = (x: string, y: string): Curve => ({ x, y });
const grid = (end: string, n: number | string = 1601, start = "0") =>
  `linspace(${start},${end},${n})`;
const time = (end: string, y: string, n: number | string = 1601) => curve(grid(end, n), y);
const common = "w0=sqrt(D/M); T0=2*pi/w0;";
const damp =
  common + "Rm=sqrt(M*D)/Qm; d=Rm/(2*M); wd=sqrt(w0^2-d^2); Aenv=hypot(x0,(v0+d*x0)/wd);";
const forced = "forced(x,M,D,Rm,F0,ratio,x0,v0,";
const free = (x0 = "x0", v0 = "v0") => `freeResponse(x,M,D,Rm,${x0},${v0})`;
const xyz = (x: string, y: string) => curve(x, y);

/** Formula templates live beside the figure definitions through matlabModel.
 * No sampled ordinates are emitted for the completed chapter 1–2 figures. */
export function modelsFor(
  id: string,
  p: Values,
  panels: Panel[],
  definitions: ParameterDefinition[] = [],
  t = 0,
  compare = false,
): Panel[] {
  let setup = "",
    curves: Curve[][] = [],
    annotations: string[][] = [];
  const end = (k: number) => String(panels[k].xlim[1]);
  switch (id) {
    case "1.1.1-1":
      setup =
        common +
        "pos=1+freeResponse(tView,M,D,0,x0,v0)/max(.001,hypot(x0,v0/w0))*.3; finish=niceEnd(3*T0);";
      curves = [
        [
          xyz("[.1 .1]", "[-.5 .5]"),
          xyz(
            ".1+(pos-.3)*(0:16)/16",
            "[0 .12 -.12 .12 -.12 .12 -.12 .12 -.12 .12 -.12 .12 -.12 .12 -.12 .12 0]",
          ),
          xyz("pos+[-.2 .2 .2 -.2 -.2]", "[-.2 -.2 .2 .2 -.2]"),
        ],
        [
          time("finish", "x0*cos(w0*x)"),
          time("finish", "v0/w0*sin(w0*x)"),
          time("finish", "freeResponse(x,M,D,0,x0,v0)"),
        ],
      ];
      break;
    case "1.1.2-1":
      setup = common + "finish=niceEnd(2*T0);";
      curves = [0, 1, 2].map((i) => [time("finish", `A*w0^${i}*cos(w0*x+${i}*pi/2)`)]);
      annotations = [0, 1, 2].map(() => ["T0/4"]);
      break;
    case "1.1.2-2":
      setup = common + "a=w0*tView;";
      curves = [
        [
          ...[0, 1, 2].map((i) => xyz(` [0 cos(a+${i}*pi/2)]`, `[0 sin(a+${i}*pi/2)]`)),
          ...[0, 1, 2].map((i) => xyz(`cos(a+${i}*pi/2)*[1 1]`, `[sin(a+${i}*pi/2) 0]`)),
        ],
      ];
      break;
    case "1.1.2-3":
      setup = common + "finish=niceEnd(2*T0); energy=D*A^2/2;";
      curves = [
        [
          time("finish", "energy*sin(w0*x).^2"),
          time("finish", "energy*cos(w0*x).^2"),
          time("finish", "energy+zeros(size(x))"),
        ],
      ];
      break;
    case "1.1.3-1":
      setup =
        common +
        "Rm=2*zeta*sqrt(M*D); d=zeta*w0; s1=-w0^2/(d+sqrt(d^2-w0^2)); finish=niceEnd(6/-s1);";
      curves = [
        [time("finish", free("x0", "0")), time("finish", free("0", "-v0")), time("finish", free())],
      ];
      break;
    case "1.1.3-2":
      setup =
        common +
        "d=zeta*w0; s1=-w0^2/(d+sqrt(d^2-w0^2)); s2=-d-sqrt(d^2-w0^2); z=linspace(0,2,801);";
      curves = [
        [
          xyz("-z+real(sqrt(complex(z.^2-1)))", "imag(sqrt(complex(z.^2-1)))"),
          xyz("-z-real(sqrt(complex(z.^2-1)))", "-imag(sqrt(complex(z.^2-1)))"),
          xyz("-1", "0"),
          xyz("[s1 s2]/w0", "[0 0]"),
        ],
      ];
      break;
    case "1.1.4-1":
    case "1.1.4-2":
      setup =
        damp +
        "finish=niceEnd(min(6/d,12*2*pi/wd)); z=(atan2((v0+d*x0)/wd,x0)+pi/2)/wd; if z<0,z=z+pi/wd;end;";
      curves = id.endsWith("-1")
        ? [
            [
              time("finish", free()),
              time("finish", "Aenv*exp(-d*x)"),
              time("finish", "-Aenv*exp(-d*x)"),
            ],
          ]
        : [[time("finish", "D*Aenv^2/2*exp(-2*d*x)")]];
      if (id.endsWith("-1")) annotations = [["z", "z+pi/wd"]];
      break;
    case "1.1.5-1":
      setup = common + "finish=niceEnd(12*T0);";
      curves = [
        [
          time("finish", "freeResponse(x,M,D,dampingResistance(M,D,input,value),1,0)"),
          ...[1.7, 5, 10].flatMap((q) => [
            time("finish", `exp(-w0*x/(2*${q})).*cos(w0*sqrt(1-1/(4*${q}^2))*x)`),
            time("finish", `exp(-w0*x/(2*${q}))`),
            xyz(`2*pi*${q}/w0`, "exp(-pi)"),
          ]),
        ],
      ];
      annotations = [["1.7*T0", "5*T0", "10*T0"]];
      break;
    case "1.2.1-1":
    case "1.2.1-2": {
      setup =
        common +
        "diff=abs(ratio-1)*w0; if diff>1e-8,finish=niceEnd(min(4*pi/diff,40*T0));else,finish=niceEnd(12*T0);end;";
      if (id.endsWith("-2")) setup += "finish=niceEnd(12*T0);";
      const n = id.endsWith("-1") ? "ceil(finish*w0/(2*pi)*100)+1" : 1601;
      const r = id.endsWith("-2") ? "1" : "ratio";
      const resp = time("finish", `forced(x,M,D,0,F0,${r},0,0,3)`, n),
        env = time("finish", `beatEnvelope(x,M,D,F0,${r})`, n),
        neg = time("finish", `-beatEnvelope(x,M,D,F0,${r})`, n);
      curves = id.endsWith("-1")
        ? [[time("finish", "F0*cos(ratio*w0*x)", n)], [resp, env, neg]]
        : [[resp, env, neg]];
      break;
    }
    case "1.2.2-1":
      setup = damp + "finish=niceEnd(7/d);";
      curves = [2, 1, 3].map((i) => [time("finish", forced + i + ")")]);
      break;
    case "1.2.3-1":
    case "1.2.3-2":
      setup = damp + "finish=niceEnd(6/d); gain=F0*Qm/D;";
      curves = id.endsWith("-1")
        ? [
            [
              time("finish", "forced(x,M,D,Rm,F0,1,0,0,3)"),
              time("finish", "gain*(1-exp(-d*x))"),
              time("finish", "-gain*(1-exp(-d*x))"),
            ],
          ]
        : [[time("finish", forced + "3)"), time("finish", forced + "1)")]];
      if (id.endsWith("-1")) annotations = [["log(20)/d"]];
      break;
    case "1.2.3-3":
      setup = common + "on=pulseCycles*T0; gap=gapCycles*T0; finish=niceEnd(2*(on+gap));";
      curves = [1.7, 5, 10].map((q) => [
        time("finish", `pulseResponse(x,M,D,sqrt(M*D)/${q},F0,on,gap)/(F0*${q}/D)`, 4001),
        time("finish", "double(x<2*(on+gap) & mod(x,on+gap)<on)", 4001),
      ]);
      break;
    case "2.1-1":
      setup =
        "c=sqrt(T/mu); h=height*cos(pi*c/L*tView); slopes=h*pi/L*cos(pi*[.4 .6]); net=-slopes(1)/hypot(1,slopes(1))+slopes(2)/hypot(1,slopes(2)); left=arrowPoints([.4*L h*sin(.4*pi)],[.15*L h*sin(.4*pi)-slopes(1)*.25*L],.1); right=arrowPoints([.6*L h*sin(.6*pi)],[.85*L h*sin(.6*pi)+slopes(2)*.25*L],.1); force=arrowPoints([.5*L h],[.5*L h+net*.2],.1);";
      curves = [
        [
          curve(grid("L", 401), "h*sin(pi*x/L)"),
          curve(grid(".6*L", 21, ".4*L"), "h*sin(pi*x/L)"),
          ...["left", "right", "force"].map((s) => xyz(`${s}(:,1)'`, `${s}(:,2)'`)),
        ],
      ];
      break;
    case "2.1-2":
      setup = "c=sqrt(T/mu); if boundary==0,k=pi/L;else,k=pi/(3*L);end; w=c*k;";
      curves = [
        [
          curve(grid("L", 401), "stringBoundary(x/L,height,F0,T,k,L,w,tView,boundary)"),
          curve(grid("L", 401), "F0*sin(pi*x/(3*L))/(T*pi/(3*L)*cos(pi/3))*cos(c*pi/(3*L)*tView)"),
          xyz("[0 L]", "stringBoundary(x/L,height,F0,T,k,L,w,tView,boundary)"),
        ],
      ];
      break;
    case "2.2-1":
      setup = "c=sqrt(T/mu);";
      curves = [1, 2, 3, 4, 5, 6].map((n) => [
        curve(grid("L", 401), `height*sin(${n}*pi*x/L)*cos(${n}*pi*c/L*tView)`),
        xyz(`L*(0:${n})/${n}`, "zeros(size(x))"),
      ]);
      break;
    case "2.2-2":
      setup = "c=sqrt(T/mu);";
      curves = [
        [
          curve(grid("L", 401), "height*min(x/L/pluck,(1-x/L)/(1-pluck))"),
          xyz("pluck*L", "height"),
        ],
        [xyz("1:12", "pluckB(x,height,pluck)")],
        [-1, 1, 0].map((dir) =>
          curve(grid("L", 401), `pluckSum(x/L,tView,c,L,height,pluck,${dir})`),
        ),
      ];
      break;
    case "2.2-3":
    case "2.4-2": {
      const str = id === "2.2-3";
      setup = `c=sqrt(${str ? "T/mu" : "E*1e9/rho"}); rigidity=${str ? "T" : "E*1e9*S"}; finish=${str ? "9000" : "120000"}; fs=linspace(0,finish,6001); poles=c/(4*L):c/(2*L):finish; fs=sort([fs poles*(1-1e-6) poles poles*(1+1e-6)]);`;
      curves = [[xyz("fs", "endResponse(x,c,L,rigidity,F0)")]];
      annotations = [panels[0].annotations?.map((_, i) => `${2 * i + 1}*c/(4*L)`) ?? []];
      break;
    }
    case "2.3-1":
      setup =
        "c=sqrt(E*1e9/rho); phase=cos(pi*c/L*tView); a=sigma*phase; b=(sigma+gradient*.2*L)*phase; stressScale=6; left=arrowPoints([.4*L 0],[.4*L-.22*a/stressScale 0],1); right=arrowPoints([.6*L 0],[.6*L+.22*b/stressScale 0],1); force=arrowPoints([.5*L .025],[.5*L+.6*(b-a)/stressScale .025],1);";
      curves = [
        [
          xyz("[0 L L 0 0]", "sqrt(S)/2*[-1 -1 1 1 -1]"),
          xyz("L*[.4 .6 .6 .4 .4]", "sqrt(S)/2*[-1 -1 1 1 -1]"),
          ...["left", "right", "force"].map((s) => xyz(`${s}(:,1)'`, `${s}(:,2)'`)),
        ],
      ];
      break;
    case "2.3-2":
      setup = "materialE=[200 70 100 65 3]*1e9; materialRho=[7850 2700 8500 2500 1180];";
      curves = [[xyz("1:5", "sqrt(materialE./materialRho)")]];
      break;
    case "2.3-3":
      setup =
        "alpha=rho*S*L/tipMass; qs=linspace(0,8,4001); poles=pi/2:pi:8; qs=sort([qs poles-1e-6 poles poles+1e-6]); roots=rodRoots(alpha);";
      curves = [
        [xyz("qs", "tanGaps(x)"), xyz("qs", "divideGaps(alpha,x)"), xyz("roots", "tan(x)")],
      ];
      break;
    case "2.4-1":
      setup = "c=sqrt(E*1e9/rho);";
      curves = [1, 2, 3].map((n) => [
        curve(grid("L", 401), `cos(${n}*pi*x/L)*cos(${n}*pi*c/L*tView)`),
        xyz("[0 L]", `cos(${n}*pi*x/L)*cos(${n}*pi*c/L*tView)`),
        xyz(`L*(2*(0:${n - 1})+1)/(2*${n})`, "zeros(size(x))"),
      ]);
      break;
    default:
      return frequencyModels(id, p, panels, definitions, compare);
  }
  const result = attach(panels, p, definitions, setup, curves, annotations, t);
  if (id === "1.1.4-2" && panels[0].series?.length === 0)
    result[0].matlabModel!.title = "'平均能量（弱阻尼近似；零值不显示）'";
  if (id === "1.1.1-1") result[1].matlabModel!.ylim = "[-1.3 2.2]*max(1e-9,hypot(x0,v0/w0))";
  if (id === "1.1.4-1")
    result[0].matlabModel!.annotationLabels = [
      "sprintf('首次过零 = %.4g s',z)",
      "sprintf('相邻过零间隔 = %.4g s',pi/wd)",
    ];

  if (id === "2.2-1" || id === "2.4-1")
    result.forEach(
      (p, i) => (p.matlabModel!.title = `sprintf('第 ${i + 1} 阶：%.4g Hz',${i + 1}*c/(2*L))`),
    );
  if (id.startsWith("2."))
    result.forEach((panel) => {
      panel.matlabModel!.xlim = `[${panel.xlim.join(" ")}]`;
      panel.matlabModel!.ylim = `[${panel.ylim.join(" ")}]`;
    });
  return result;
}

export function attach(
  panels: Panel[],
  p: Values,
  defs: ParameterDefinition[],
  setup: string,
  curves: Curve[][],
  annotations: string[][] = [],
  t = 0,
): Panel[] {
  return panels.map((panel, k) => {
    if (
      curves[k]?.length !== panel.series?.length &&
      !(panel.series?.length === 0 && panel.yscale === "log" && curves[k]?.length === 1)
    )
      throw new Error(`MATLAB model series mismatch: ${panel.title}`);
    const parameters = Object.entries({ ...p, tView: t }).map(([key, value]) => {
      const d = defs.find((d) => d.key === key);
      return {
        key,
        value,
        comment: d
          ? `${d.name} (${d.unit})`
          : (parameterComments[key] ?? `${key}（SI 单位或无量纲选择值）`),
      };
    });
    return {
      ...panel,
      matlabModel: {
        parameters,
        setup,
        series: curves[k],
        annotations: annotations[k],
        xlim:
          setup.includes("finish=") && !panel.xlabel.includes("示意")
            ? "[0 finish]"
            : `[${panel.xlim.join(" ")}]`,
        ylim:
          panel.xlabel.includes("示意") ||
          panel.ylabel.includes("示意") ||
          panel.title.includes("矢量")
            ? `[${panel.ylim.join(" ")}]`
            : undefined,
      },
    };
  });
}
const parameterComments: Record<string, string> = {
  M: "质量 (kg)",
  D: "弹性系数 (N/m)",
  Rm: "力阻 (kg/s)",
  F0: "激励力幅值 (N)",
  n: "转速 (r/min)",
  limit: "位移限值 (mm)",
  x0: "初始位移 (m)",
  v0: "初始速度 (m/s)",
  Qm: "品质因数 (无量纲)",
  tView: "动画快照时间 (s)",
  input: "阻尼输入方式 (0=力阻, 1=衰减率, 2=品质因数)",
  value: "所选阻尼量 (kg/s、s^-1 或无量纲)",
  boundary: "右端边界类型 (0–3)",
  material: "材料预设编号 (0–4)",
  target: "目标基频 (Hz)",
  tObs: "观测时间 (s)",
};

function frequencyModels(
  id: string,
  p: Values,
  panels: Panel[],
  defs: ParameterDefinition[],
  compare: boolean,
): Panel[] {
  let setup =
      common + "f0=w0/(2*pi); d=Rm/(2*M); f1=(hypot(w0,d)-d)/(2*pi); f2=(hypot(w0,d)+d)/(2*pi);",
    curves: Curve[][] = [],
    annotations: string[][] = [];
  if (id === "1.2.4-1") {
    setup += "finish=niceEnd(2.5*f0);";
    const rs = compare ? ["w0*M/1.7", "w0*M/5", "w0*M/10"] : ["Rm"];
    curves = [0, 1, 2, 3, 4, 5].map((i) =>
      rs.map((r) => curve(grid("finish", 1201), `frequencyResponse(x,M,D,${r},F0,${i + 1})`)),
    );
    annotations = [0, 1, 2].map((i) =>
      i === 1
        ? ["f0"]
        : rs.map((r) =>
            i === 0
              ? `f0*sqrt(max(0,1-2*(${r}/(2*M*w0))^2))`
              : `f0/sqrt(max(0,1-2*(${r}/(2*M*w0))^2))`,
          ),
    );
  } else if (id === "1.2.4-2") {
    setup += "finish=niceEnd(2.5*f0);";
    curves = [
      [7, 8, 9].map((i) =>
        curve(grid("finish", 401, ".001*f0"), `frequencyResponse(x,M,D,Rm,F0,${i})`),
      ),
    ];
    annotations = [["f0", "0"]];
  } else if (id === "1.2.5-1" || id === "B-1") {
    setup += "finish=niceEnd(max(2*f0,1.15*f2)); fs=sort([linspace(0,finish,1401) f0 f1 f2]);";
    curves = [[xyz("fs", "frequencyResponse(x,M,D,Rm,F0,10)")]];
    if (id === "B-1") curves[0].push(xyz("f0", "F0^2/(2*Rm)"));
    annotations = [["f0", "f1", "f2", "F0^2/(4*Rm)"]];
  } else if (id === "1.2.5-2") {
    setup += "finish=niceEnd(3/f0);";
    curves = [0.8, 1, 1.2].map((r) => [
      time("finish", `instantPower(x,${r}*f0,M,D,Rm,F0)`, 601),
      xyz("[0 finish]", `frequencyResponse(${r}*f0,M,D,Rm,F0,10)*[1 1]`),
    ]);
  } else if (id === "A-1") {
    setup +=
      "finish=niceEnd(max(60,1.8*f0)); fx=f0*sqrt(max(0,1-2*(Rm/(2*M*w0))^2)); fx400=f0*sqrt(max(0,1-2*(400/(2*M*w0))^2));";
    curves = [
      [
        xyz("sort([linspace(0,finish,2001) f0 fx n/60])", "1000*frequencyResponse(x,M,D,Rm,F0,1)"),
        xyz(
          "sort([linspace(0,finish,2001) f0 fx400 n/60])",
          "1000*frequencyResponse(x,M,D,400,F0,1)",
        ),
        xyz("n/60", "1000*frequencyResponse(x,M,D,Rm,F0,1)"),
      ],
    ];
    annotations = [["n/60", "limit"]];
  } else throw new Error(`Missing MATLAB model ${id}`);
  if (id === "B-1") setup = "Rm=2*pi*M*(f2-f1);F0=Rm*velocity;" + setup;
  const result = attach(panels, p, defs, setup, curves, annotations);
  if (id === "1.2.4-1")
    result.slice(0, 3).forEach((panel, i) => {
      panel.matlabModel!.annotationLabels = panel.matlabModel!.annotations?.map(
        (value, k) =>
          `sprintf('${i === 1 ? "f_v = f_0" : `${compare ? `Q_m=${[1.7, 5, 10][k]}: ` : ""}f_${i === 0 ? "x" : "a"}`} = %.4g Hz',${value})`,
      );
    });
  if (id === "B-1")
    result[0].matlabModel!.parameters = result[0].matlabModel!.parameters.filter(
      (p) => p.key !== "Rm" && p.key !== "F0",
    );
  if (id === "A-1") {
    result[0].title = `支架位移幅值 = ${Number(((1000 * p.F0) / Math.hypot(p.Rm, ((2 * Math.PI * p.n) / 60) * p.M - p.D / ((2 * Math.PI * p.n) / 60)) / ((2 * Math.PI * p.n) / 60)).toPrecision(4))} mm`;
    result[0].matlabModel!.title =
      "sprintf('支架位移幅值 = %.4g mm',1000*frequencyResponse(n/60,M,D,Rm,F0,1))";
  }
  if (id === "B-1") {
    result[0].title = `平均输入功率 = ${Number(((p.Rm * p.velocity ** 2) / 2).toPrecision(4))} W`;
    result[0].matlabModel!.title = "sprintf('平均输入功率 = %.4g W',Rm*velocity^2/2)";
  }
  if (id.startsWith("1.2.4"))
    result.forEach(
      (panel) =>
        (panel.matlabModel!.setup +=
          "\nlecture_readouts=[f0 w0*M/Rm f0*sqrt(1-2*(Rm/(2*M*w0))^2) f0 f0/sqrt(1-2*(Rm/(2*M*w0))^2) Rm 0];"),
    );
  if (id.startsWith("1.2.5"))
    result.forEach(
      (panel) =>
        (panel.matlabModel!.setup +=
          "\nlecture_readouts=[f1 f2 f2-f1 f0/(w0*M/Rm) F0^2/(2*Rm) F0^2/(2*Rm) F0^2/(2*Rm)];"),
    );
  if (id === "A-1")
    result[0].matlabModel!.ylim =
      "[0 1.7*max(1000*frequencyResponse(fx,M,D,Rm,F0,1),1000*frequencyResponse(fx400,M,D,400,F0,1))]";
  if (id === "A-1")
    result[0].matlabModel!.setup +=
      "\nQm=w0*M/Rm; bandwidth=Rm/(2*pi*M); workOmega=2*pi*n/60; Xm=workOmega*M-D/workOmega; xMm=1000*frequencyResponse(n/60,M,D,Rm,F0,1); minimumRm=sqrt(max(0,(F0/(workOmega*limit/1000))^2-Xm^2)); worksheet_answers=[f0 Qm bandwidth xMm minimumRm];";
  if (id === "B-1")
    result[0].matlabModel!.setup +=
      "\nQm=w0*M/Rm; power=F0^2/(2*Rm); force=F0; worksheet_answers=[Qm Rm power force];";
  if (id === "1.2.5-2")
    result.forEach(
      (p, i) =>
        (p.matlabModel!.title = `sprintf('f = ${[0.8, 1, 1.2][i]} f_0 (%.4g Hz)',${[0.8, 1, 1.2][i]}*f0)`),
    );
  if (id === "1.2.5-1" || id === "B-1") {
    result[0].matlabModel!.bands = [{ from: "f1", to: "f2" }];
    result[0].matlabModel!.ylim = "[0 1.7*F0^2/(2*Rm)]";
  }
  if (id === "1.2.4-2") {
    result[0].matlabModel!.ylim = "[-max(7*w0*M,Rm*1.15) max(7*w0*M,Rm*1.15)]";
    result[0].matlabModel!.legendLocation = "southeast";
  }
  return result;
}
