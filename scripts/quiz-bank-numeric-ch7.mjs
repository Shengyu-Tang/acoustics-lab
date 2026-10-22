// Independent chapter-7 oracles. No website physics imports or expression evaluation.
import assert from "node:assert/strict";

export const chapter7Units = {
  "Np/m": ["amplitude-attenuation", 1],
  "s^2/m": ["classical-absorption-constant", 1],
  "mV/Pa": ["pressure-sensitivity", 0.001],
  mV: ["voltage", 0.001],
  μs: ["time", 1e-6],
};

export const chapter7Methods = {
  "calibrated-plane-absorption": {
    inputs: {
      U1: "voltage",
      U2: "voltage",
      H1: "pressure-sensitivity",
      H2: "pressure-sensitivity",
      L: "length",
    },
    unit: "amplitude-attenuation",
    formula: String.raw`$\alpha=\frac{1}{L}\ln\frac{U_1/H_1}{U_2/H_2}$`,
    compute: ({ U1, U2, H1, H2, L }) => {
      assert.ok(U1 > 0 && U2 > 0 && H1 > 0 && H2 > 0 && L > 0);
      // Form calibrated intensity ratio first, then convert its logarithmic slope
      // to an amplitude coefficient. This catches the factor-of-two error.
      const intensityRatio = (U1 * H2) ** 2 / (U2 * H1) ** 2;
      assert.ok(intensityRatio > 1);
      return Math.log(intensityRatio) / (2 * L);
    },
  },
  "two-frequency-relaxation-time": {
    inputs: {
      f: "frequency",
      B: "classical-absorption-constant",
      alpha1: "amplitude-attenuation",
      alpha2: "amplitude-attenuation",
    },
    unit: "time",
    formula: String.raw`$\tau=\frac{1}{2\pi f}\sqrt{\frac{4-R}{4(R-1)}},\quad R=\frac{\alpha_2-B(2f)^2}{\alpha_1-Bf^2}$`,
    compute: ({ f, B, alpha1, alpha2 }) => {
      assert.ok(f > 0 && B >= 0 && alpha1 > 0 && alpha2 > 0);
      const residual1 = alpha1 - B * f * f;
      const residual2 = alpha2 - B * (2 * f) ** 2;
      assert.ok(residual1 > 0 && residual2 > 0);
      const ratio = residual2 / residual1;
      assert.ok(
        ratio > 1 && ratio < 4,
        "a positive finite single relaxation time requires 1 < R < 4",
      );
      // Solve the original ratio of relaxation responses by monotone bisection
      // in u = omega*tau, independently of the displayed inverse formula.
      const responseRatio = (u) => (4 * (1 + u * u)) / (1 + 4 * u * u);
      let lo = 0,
        hi = 1;
      while (responseRatio(hi) > ratio) hi *= 2;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if (responseRatio(mid) > ratio) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2 / (2 * Math.PI * f);
    },
  },
  "impedance-threshold-bandwidth": {
    inputs: { r: "dimensionless", b: "dimensionless", f0: "frequency", threshold: "dimensionless" },
    unit: "frequency",
    formula: String.raw`$\Delta f=\frac{f_0}{b}\sqrt{\frac{4r}{\alpha_{\min}}-(1+r)^2}$`,
    compute: ({ r, b, f0, threshold }) => {
      assert.ok(r > 0 && b > 0 && f0 > 0 && threshold > 0 && threshold <= 1);
      const peak = (4 * r) / (1 + r) ** 2;
      assert.ok(threshold < peak, "threshold must lie below the realizable peak");
      // Locate the two crossings of the full absorption curve, rather than
      // reusing the simplified bandwidth expression or assuming half power.
      const absorption = (f) => {
        const x = b * (f / f0 - f0 / f);
        return (4 * r) / ((1 + r) ** 2 + x * x);
      };
      let low = f0 / 2,
        high = f0 * 2;
      while (absorption(low) > threshold) low /= 2;
      while (absorption(high) > threshold) high *= 2;
      const crossing = (lo, hi, rising) => {
        for (let i = 0; i < 100; i++) {
          const mid = (lo + hi) / 2;
          if (absorption(mid) < threshold === rising) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      };
      return crossing(f0, high, false) - crossing(low, f0, true);
    },
  },
};
