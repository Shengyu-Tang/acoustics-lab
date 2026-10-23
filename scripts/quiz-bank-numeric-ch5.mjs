// Independent chapter-5 calculations. No website physics imports or expression evaluation.
import assert from "node:assert/strict";

export const chapter5Methods = {
  "impedance-boundary-forcing": {
    inputs: { Pr: "pressure", Pi: "pressure", Z: "specific-impedance", v: "velocity" },
    unit: "pressure",
    formula: String.raw`$|g|=\sqrt{(Z_nv_{in}-\Re P_i)^2+(\Im P_i)^2}$`,
    compute: ({ Pr, Pi, Z, v }) => {
      // Zn uses the stated outward velocity, so a passive real Zn is negative.
      // Both signs are valid mathematical inputs; reject only nonfinite data.
      assert.ok([Pr, Pi, Z, v].every(Number.isFinite));
      // Construct the real and imaginary parts of Zn*vin - Pi separately.
      return Math.hypot(Z * v - Pr, -Pi);
    },
  },
  "rayleigh-sphere-backward-cone": {
    inputs: { theta0: "angle" },
    unit: "dimensionless",
    formula: String.raw`$\eta=\frac{G(\cos\theta_0)-G(-1)}{G(1)-G(-1)},\quad G(x)=x-\frac32x^2+\frac34x^3$`,
    compute: ({ theta0 }) => {
      assert.ok(theta0 >= 0 && theta0 <= Math.PI);
      // Integrate the squared angular amplitude with the solid-angle Jacobian.
      // This does not use the displayed antiderivative.
      const integral = (lo, hi) => {
        const n = 4000,
          h = (hi - lo) / n;
        const f = (theta) => (1 - 1.5 * Math.cos(theta)) ** 2 * Math.sin(theta);
        let sum = f(lo) + f(hi);
        for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(lo + i * h);
        return (sum * h) / 3;
      };
      return integral(theta0, Math.PI) / integral(0, Math.PI);
    },
  },
  "cylinder-two-mode-scattering-width": {
    inputs: {
      k: "curvature",
      c0r: "dimensionless",
      c0i: "dimensionless",
      c1r: "dimensionless",
      c1i: "dimensionless",
    },
    unit: "length",
    formula: String.raw`$\sigma_L=\frac4k\left[|c_{\rm m0}|^2+\frac12|c_{\rm m1}|^2\right]$`,
    compute: ({ k, c0r, c0i, c1r, c1i }) => {
      assert.ok(k > 0);
      // Periodic trapezoidal quadrature retains the interference term before integration.
      const n = 4096;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const x = Math.cos((2 * Math.PI * i) / n);
        sum += (c0r + c1r * x) ** 2 + (c0i + c1i * x) ** 2;
      }
      return (2 / (Math.PI * k)) * sum * ((2 * Math.PI) / n);
    },
  },
};
