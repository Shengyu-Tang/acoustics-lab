# MATLAB evidence for review P3-1

`manifest.json` identifies the current 246 regenerated scripts (two parameter sets for all 75 simulation figures and 48 examples) in the P2/P3 folders, with parameters and SHA-256 hashes. Parameter variants respect control bounds and steps. `syntax-check.json` and `mlint.log` record a successful R2024b Code Analyzer pass; diagnostics are advisory only.

`runtime-attempt.json` records the one authorized startup attempt. It timed out after 300 seconds without reaching the first line of the batch script. MATLAB runtime, numerical export comparisons, and new MATLAB PNG review therefore remain **pending**. Existing runtime reports and PNGs in older evidence directories describe earlier revisions and do not validate these regenerated scripts.

Reproduction:

```powershell
node scripts/regenerate-p3-review-matlab.mjs
```

When MATLAB startup is working, the existing `scripts/check-matlab-models.mjs --batch=P2` and `--batch=P3` workflows can prepare and run independent-script numerical/PNG checks. The startup probe was not retried in this task.
