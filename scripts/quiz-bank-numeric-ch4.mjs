// Independent checks for chapter 4. No imports from src/physics or evaluated expressions.
import assert from "node:assert/strict";
export const chapter4Units = {
  "m^3/s": ["volume-velocity", 1],
  mPa: ["pressure", 0.001],
};
export const chapter4Methods = {
  "loaded-resonance": {
    inputs: { M: "mass", Ms: "mass", D: "stiffness" },
    unit: "frequency",
    formula: String.raw`$f_r=\frac1{2\pi}\sqrt{\frac D{M+M_s}}$`,
    compute: ({ M, Ms, D }) => {
      assert.ok(M > 0 && Ms > 0 && D > 0);
      return Math.sqrt(D / (M + Ms)) / (2 * Math.PI);
    },
  },
  "sphere-pressure-fraction-frequency": {
    inputs: { a: "length", c: "velocity", s: "dimensionless" },
    unit: "frequency",
    formula: String.raw`$f=\frac{c_0}{2\pi a}\frac{s}{\sqrt{1-s^2}}$`,
    compute: ({ a, c, s }) => {
      assert.ok(a > 0 && c > 0 && s > 0 && s < 1);
      return c / (2 * Math.PI * a * Math.sqrt(1 / s ** 2 - 1));
    },
  },
  "sphere-radius-from-added-mass": {
    inputs: { Ms: "mass", rho: "density" },
    unit: "length",
    formula: String.raw`$a=\left(\frac{M_s}{4\pi\rho_0}\right)^{1/3}$`,
    compute: ({ Ms, rho }) => {
      assert.ok(Ms > 0 && rho > 0);
      return Math.cbrt(Ms / (4 * Math.PI * rho));
    },
  },
  "coherent-two-point-pressure": {
    inputs: {
      rho: "density",
      f: "frequency",
      c: "velocity",
      Q: "volume-velocity",
      r1: "length",
      r2: "length",
    },
    unit: "pressure",
    formula: String.raw`$|P|=\frac{\rho_0 fQ}{2}\sqrt{\frac1{r_1^2}+\frac1{r_2^2}+\frac{2\cos[2\pi f(r_2-r_1)/c_0]}{r_1r_2}}$`,
    compute: ({ rho, f, c, Q, r1, r2 }) => {
      assert.ok([rho, f, c, Q, r1, r2].every((x) => x > 0));
      const k = (2 * Math.PI * f) / c;
      // Explicit complex sum, independently of the displayed cosine law.
      const re = Math.cos(k * r1) / r1 + Math.cos(k * r2) / r2;
      const im = -Math.sin(k * r1) / r1 - Math.sin(k * r2) / r2;
      return (rho * f * Q * Math.hypot(re, im)) / 2;
    },
  },
  "dipole-cone-power-fraction": {
    inputs: { alpha: "angle" },
    unit: "dimensionless",
    formula: String.raw`$\eta_{\rm cones}=1-\cos^3\alpha$`,
    compute: ({ alpha }) => {
      assert.ok(alpha > 0 && alpha < Math.PI / 2);
      // Independent quadrature of cos²(theta) sin(theta) over both caps.
      const n = 2000,
        h = alpha / n;
      const integrand = (t) => Math.cos(t) ** 2 * Math.sin(t);
      let sum = integrand(0) + integrand(alpha);
      for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * integrand(i * h);
      return sum * h; // Simpson integral times 3 for the two caps / full sphere.
    },
  },
  "boundary-phase-sampling-limit": {
    inputs: { N: "dimensionless", R: "length", c: "velocity", phi: "angle" },
    unit: "frequency",
    formula: String.raw`$f_{\max}=\frac{\phi_{\max}Nc_0}{4\pi^2R}$`,
    compute: ({ N, R, c, phi }) => {
      assert.ok(Number.isInteger(N) && N >= 4 && R > 0 && c > 0 && phi > 0 && phi < Math.PI);
      const spacing = (2 * Math.PI * R) / N;
      return ((phi / spacing) * c) / (2 * Math.PI);
    },
  },
  "incoming-from-radiation-residual": {
    inputs: { E: "pressure", f: "frequency", c: "velocity", R: "length" },
    unit: "pressure",
    formula: String.raw`$|P_{\rm in}(R)|=\frac{Ec_0}{4\pi fR}$`,
    compute: ({ E, f, c, R }) => {
      assert.ok([E, f, c, R].every((x) => x > 0));
      const k = (2 * Math.PI * f) / c;
      return E / (2 * k) / R;
    },
  },
  "baffled-patch-axis-pressure": {
    inputs: {
      rho: "density",
      f: "frequency",
      r: "length",
      S1: "area",
      S2: "area",
      v1: "velocity",
      v2: "velocity",
    },
    unit: "pressure",
    formula: String.raw`$|P(r,0)|=\frac{\rho_0 f}{r}|S_1v_1+S_2v_2|$`,
    compute: ({ rho, f, r, S1, S2, v1, v2 }) => {
      assert.ok([rho, f, r, S1, S2].every((x) => x > 0));
      const omega = 2 * Math.PI * f;
      return (Math.abs(S1 * v1 + S2 * v2) * omega * rho) / (2 * Math.PI * r);
    },
  },
  "piston-first-axial-node": {
    inputs: { a: "length", lambda: "length" },
    unit: "length",
    formula: String.raw`$z_{\rm node}=\frac{a^2-\lambda^2}{2\lambda}$`,
    compute: ({ a, lambda }) => {
      assert.ok(a > lambda && lambda > 0);
      const z = ((a / lambda - lambda / a) * a) / 2;
      assert.ok(Math.abs(Math.hypot(z, a) - z - lambda) < lambda * 1e-10);
      return z;
    },
  },
};
