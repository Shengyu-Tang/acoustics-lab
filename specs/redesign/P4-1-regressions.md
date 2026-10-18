# P4-1 regression evidence

Ran `node scripts/check-p4-review.mjs` against the original implementation,
before editing production sources. Exit status: **1**.

Observed failures:

- A1: `4.1-1: 球面振源的真实截面`; radius did not affect physical response data.
- A2: `schematic` was undefined rather than `force-voltage`.
- A3: `6.2-2` default relative variation was 0.0054731012 (0.547%);
  the coincident curves lacked a visible directional response.
- B1: exterior-integral example crossed the excluded quadrature boundary region.
- B4: dipole field used saturated linear pressure rather than a readable dB field.
- B5: the master specification still stated 19 lectures.

B2 lane-collision tests and B3 half-polar browser/model export checks passed
at baseline. Their rendered browser and MATLAB output is also reviewed in this round.

The geometry-only test subsequently caught the single wedge outline in `7.3-3`.
It now includes the explicitly qualitative impedance distribution, retaining
the warning that this is not a quantitative waterborne material model.

`npm test` includes these checks. The size-sensitivity contract accepts
actual computed physical response data or annotations instead of requiring
an isolated geometry trace. Marked field boundaries still have their metre
scaling tested directly.

## MATLAB PNG follow-up

Visual inspection found a B2 export-only collision: minimum and Rayleigh-distance labels shared a height. Added a MATLAB lane test **before** its fix; it failed with `duplicate MATLAB label lanes: 2,4,0,4` (exit 1). Each exported vertical-line label now has its own lane below the region captions. The circuit also initializes its sphere readouts before the common worksheet setup. The wedge field uses a shared floating-point boundary tolerance in JavaScript and MATLAB.

The browser capture regression was then strengthened to enforce the referenced xline rule: labels must be inside the axes. It failed before the renderer change with 'B2 xline labels must stay inside the axes' (exit 1). The final captures pass this check at both viewports, with no label collisions.
