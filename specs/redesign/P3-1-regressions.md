# P3-1 regression evidence

Tests were added and run before the corresponding fixes. Only new commits were used.

| Test | Observed failure before fix | Result after fix |
| --- | --- | --- |
| A1 physical examples | `src/content/p2.ts still uses answerCurve` | All 48 designs have different axis/series/geometry signatures; no generic helper or ±10% input sweep remains. |
| A2 preserve axis definitions | Old worksheet wrapper changed the declared `振速幅值 (m/s)` to the answer-derived `界面振速峰值 (m/s)`. | Explicit physical axis definitions are preserved. Browser checks compare every panel's rendered labels with its definition after hash navigation. |
| A3 averaged standing-wave energy | `potential energy is zero` at the default phase. | Both spatially complementary averages are nonzero; their sum equals `pa²/(Z1*c)` at every sampled distance, for multiple pressures and times. |
| B1/B2 answer notation | `3.1.3 dimensionless dash`; small numbers used decimal notation. | Dimensionless titles omit the unit placeholder; one four-significant-digit scientific formatter supplies titles and readouts. |
| B3 finite SPL domain | `destructive boundary sentinel stretches y axis` | Exact pressure-release null is represented as a break (−∞ dB), not an artificial finite floor. Finite interior levels determine the axis. |
| Scientific-axis visibility | Browser test found legends covering `×10⁻⁷`, `×10⁻⁴`, etc., in both viewports. | Dedicated space separates scientific multipliers from legends. Scientific-number tokens also remain intact when legend text wraps. |
| A4 categorical fields | Passed on the initial revision: the earlier categorical fix was already present. | Kept and verified across the site; no continuous colorbar on the binary map. |

The review's exact duplicate/stale-label symptom was not reproduced in the initial DOM sweep. The confirmed answer-driven axis mutation was removed, and axes now have semantic label identities and remount when their schema changes. Final screenshots and browser assertions cover the reported figures, including transitions between field, categorical, dual-axis, and geometry plots. The result is verified; the initial stale-paint symptom is not claimed as separately reproduced.

The old P3 worksheet test assumed that the first curve was a generic continuous sweep covering 99% of the axis. Modal bars, rays and separate incident/transmitted regions invalidate that assumption. It now checks finite visible physical data and the aggregate left-axis extent, retaining 40% occupancy for linear plots. Logarithmic power bars are checked in log coordinates with decade-rounded margins. New tests independently reject duplicate designs and generic input sweeps.
