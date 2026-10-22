// Independent chapter-6 checks; no website physics imports or expression evaluation.
import assert from "node:assert/strict";

export const chapter6Units = { "%": ["dimensionless", 0.01] };

export const chapter6Methods = {
  "receiver-two-frequency-ratio": {
    inputs: {
      x1: "dimensionless",
      x2: "dimensionless",
      Rm1: "resistance",
      Xm1: "resistance",
      R21: "resistance",
      X21: "resistance",
      Rm2: "resistance",
      Xm2: "resistance",
      R22: "resistance",
      X22: "resistance",
    },
    unit: "dimensionless",
    formula: String.raw`$\frac{|U_2|}{|U_1|}=\sqrt{\frac{1+x_1^2}{1+x_2^2}}\sqrt{\frac{(R_{m1}+R_{21})^2+(X_{m1}+X_{21})^2}{(R_{m2}+R_{22})^2+(X_{m2}+X_{22})^2}},\quad x_i=k_i a$`,
    compute: ({ x1, x2, Rm1, Xm1, R21, X21, Rm2, Xm2, R22, X22 }) => {
      assert.ok(x1 >= 0 && x2 >= 0 && Rm1 > 0 && Rm2 > 0 && R21 >= 0 && R22 >= 0);
      // Construct 1 / [(1+jka)(Zm+Z2s)] as a complex inverse at each frequency.
      // This checks the quotient of square roots against the complete transfer.
      const transfer = (x, resistance, reactance) => {
        const re = resistance - x * reactance;
        const im = reactance + x * resistance;
        const norm2 = re * re + im * im;
        assert.ok(norm2 > 0);
        return Math.hypot(re / norm2, -im / norm2);
      };
      return transfer(x2, Rm2 + R22, Xm2 + X22) / transfer(x1, Rm1 + R21, Xm1 + X21);
    },
  },
  "reciprocity-complex-residual": {
    inputs: {
      PBr: "pressure",
      PBi: "pressure",
      PAr: "pressure",
      PAi: "pressure",
      QA: "volume-velocity",
      QB: "volume-velocity",
    },
    unit: "dimensionless",
    formula: String.raw`$\eta=100\frac{\sqrt{(\Re P_B\,Q_B-\Re P_A\,Q_A)^2+(\Im P_B\,Q_B-\Im P_A\,Q_A)^2}}{|P_B|Q_B}\%$`,
    compute: ({ PBr, PBi, PAr, PAi, QA, QB }) => {
      assert.ok(QA > 0 && QB > 0 && Math.hypot(PBr, PBi) > 0);
      // Normalize each measurement by its own emitting source, then subtract
      // complex components. No crossed-product formula or amplitude subtraction.
      const forward = [PBr / QA, PBi / QA];
      const reverse = [PAr / QB, PAi / QB];
      return Math.hypot(forward[0] - reverse[0], forward[1] - reverse[1]) / Math.hypot(...forward);
    },
  },
};
