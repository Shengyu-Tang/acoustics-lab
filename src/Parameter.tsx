import { useState } from "react";
export type ParameterDefinition = {
  key: string;
  name: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};
export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="number"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={draft ?? Number(value.toPrecision(4))}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() && Number.isFinite(n) && n >= min && n <= max) onChange(n);
      }}
      onBlur={() => {
        if (draft !== null && draft.trim() && Number.isFinite(Number(draft)))
          onChange(Math.min(max, Math.max(min, Number(draft))));
        setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(null);
      }}
    />
  );
}
export default function Parameter({
  definition: d,
  value,
  onChange,
}: {
  definition: ParameterDefinition;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="compact-parameter">
      <span>
        {d.name} {d.symbol}
      </span>
      <NumberField value={value} onChange={onChange} {...d} label={`${d.name}数值`} />
      <span>{d.unit}</span>
      <input
        aria-label={`${d.name}滑块`}
        type="range"
        min={d.min}
        max={d.max}
        step={d.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
