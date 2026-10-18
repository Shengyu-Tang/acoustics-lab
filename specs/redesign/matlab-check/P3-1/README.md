# MATLAB evidence for review P3-1

All 246 scripts (two distinct parameter sets for 75 simulation figures and 48 examples) passed MATLAB R2024b runtime, curve/field/readout/answer comparisons with the web formulas, and visual PNG review.

`manifest.json` now points to the validated scripts in this folder and preserves their original P2/P3 paths and hashes as `originalFile` / `originalSha256`. `results.json` records current script and PNG hashes, errors, timings and visual coverage. Keeping this cohort separate preserves its parameter pairs independently of the standard P3 batch.

`runtime-attempt.json`, `mlint.log` and `syntax-check.json` are historical evidence from before runtime recovery; the failed startup attempt is superseded by the complete runtime report.

Reproduce from the repository root:

```powershell
node scripts/check-matlab-models.mjs --manifest=specs/redesign/matlab-check/P3-1/manifest.json --out=specs/redesign/matlab-check/P3-1 --workers=2 --timeout-ms=300000
```

See [full backlog results](../../MATLAB-backlog-validation.json).
