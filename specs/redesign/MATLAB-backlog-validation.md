# MATLAB R2024b runtime backlog validation

| Batch | Scripts / parameter sets | MATLAB | PNG review | Max normalized error |
| --- | ---: | --- | --- | ---: |
| review-P2-3 / P1 | 60/60 | PASS | 60/60 | 4.112e-10 |
| review-P2-3 / P2 | 68/68 | PASS | 68/68 | 1.144e-12 |
| P3 | 136/136 | PASS | 136/136 | 1.776e-10 |
| review-P3-1 | 246/246 | PASS | 246/246 | 1.531e-10 |
| 4.4.3-1 half polar | 2/2 | PASS | 2/2 | 9.153e-11 |

All 512 current scripts passed independent runtime and web-formula comparisons, with two distinct parameter sets per figure/example and a 300-second timeout per process. All final PNGs were inspected. The full per-script parameters, hashes, PNG hashes, numerical errors and visual coverage are in [MATLAB-backlog-validation.json](MATLAB-backlog-validation.json).

The scripts and PNGs are in the batch folders listed in the JSON. P3-1 uses its own folder to retain its original parameter pairs independently of the P3 batch; its manifest preserves the original P2/P3 paths and hashes. Earlier blocked startup attempts and mlint-only records are historical and are superseded by this runtime report.

The 4.4.3-1 plot uses a -90..90-degree half-polar grid in both renderers; both MATLAB angular/radial limits were checked. Legends are outside the curves, dynamic labels have reserved width, edge labels point into the plotting area, and categorical mode maps use exactly two colors.

Passed: npm ci, npm test, animation checks, production build, all 82 lecture/auxiliary browser routes at 1440 and 390 pixels, all P2/P3 axis-label checks/captures, and the half-polar browser checks.
