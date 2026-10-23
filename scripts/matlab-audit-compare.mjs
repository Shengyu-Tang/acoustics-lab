import assert from "node:assert/strict";

// Old browser manifests omitted figure parameters. Recover the actual numeric
// parameter block, never today's defaults or a guessed slider position.
export function scriptParameters(source) {
  const header = source.split("% 以下为计算模型")[0];
  return Object.fromEntries(
    [...header.matchAll(/^([A-Za-z]\w*)\s*=\s*([-+\d.eE]+);/gm)].map((m) => [m[1], Number(m[2])]),
  );
}

export function webExpectation(data, entry, source) {
  const query = new URLSearchParams(entry.route.split("?")[1]);
  const topic = query.get("topic");
  const lecture = data.lectures.find((l) => l.id === topic);
  const parameters = { ...entry.parameters, ...scriptParameters(source) };
  if (entry.category === "figure") {
    if (!lecture) {
      const kind = data.topics.find((t) => t.id === topic).model;
      return { parameters, panels: data.legacyPanels(kind, parameters, 0) };
    }
    const figure = lecture.figures[entry.figure];
    return { parameters, panels: figure.plot(parameters, parameters.tView ?? 0) };
  }
  const example = entry.route.startsWith("#/cases")
    ? data.engineeringCases.find((e) => e.id === query.get("project"))
    : topic === "1.2.4"
      ? data.instrumentExample
      : topic === "1.2.5"
        ? data.bandwidthExample
        : lecture.examples[entry.worksheet];
  const plot =
    topic === "1.2.4"
      ? data.instrumentPanel
      : topic === "1.2.5"
        ? data.bandwidthPanel
        : example.plot;
  const solution = example.solve?.(parameters);
  return {
    parameters,
    panels: [plot(parameters), ...(example.additionalPlots?.(parameters) ?? [])],
    answers: example.asks.map((a) => (a.calc ? a.calc(parameters) : solution[a.key])),
  };
}

export function compareMatlab(actual, expected) {
  let samples = 0,
    maxRelativeError = 0;
  const near = (value, reference, label) => {
    samples++;
    if (!Number.isFinite(reference)) {
      assert.equal(value, null, label);
      return;
    }
    assert.ok(Number.isFinite(value), `${label}: missing/nonfinite value`);
    const error = Math.abs(value - reference) / Math.max(1, Math.abs(reference));
    maxRelativeError = Math.max(error, maxRelativeError);
    assert.ok(error <= 1e-7, `${label}: MATLAB ${value}, web ${reference}, error ${error}`);
  };
  const array = (v) => (Array.isArray(v) ? v : [v]);
  let curves = 0,
    fields = 0;
  expected.panels.forEach((panel, k) => {
    const p = actual.panels?.[k];
    assert.ok(p, `panel ${k}: missing model samples`);
    (panel.series ?? []).forEach((series, i) => {
      const x = array(p.x[i]),
        y = array(p.y[i]);
      assert.equal(x.length, series.points.length, `panel ${k} series ${i} x length`);
      assert.equal(y.length, series.points.length, `panel ${k} series ${i} y length`);
      series.points.forEach(([xx, yy], j) => {
        near(x[j], xx, `panel ${k} series ${i} x[${j}]`);
        near(y[j], yy, `panel ${k} series ${i} y[${j}]`);
      });
      curves++;
    });
    if (panel.field) {
      const f = actual.fields?.[k];
      assert.ok(f, `panel ${k}: missing field`);
      const compareVector = (values, refs, label) => {
        assert.equal(values.length, refs.length, label + " length");
        refs.forEach((v, i) => near(values[i], v, `${label}[${i}]`));
      };
      compareVector(f.x, panel.field.x, "field x");
      compareVector(f.y, panel.field.y, "field y");
      assert.equal(f.z.length, panel.field.z.length, "field rows");
      panel.field.z.forEach((row, j) => compareVector(f.z[j], row, `field row ${j}`));
      fields++;
    }
  });
  if (expected.answers) {
    assert.equal(actual.answers?.length, expected.answers.length, "worksheet answer count");
    expected.answers.forEach((v, i) => near(actual.answers[i], v, `answer ${i}`));
  }
  return {
    samplesCompared: samples,
    curvesCompared: curves,
    fieldsCompared: fields,
    answersCompared: expected.answers?.length ?? 0,
    maxRelativeError,
  };
}
