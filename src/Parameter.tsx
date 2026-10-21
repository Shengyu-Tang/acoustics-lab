import ScriptText from "./ScriptText";
import { useId, useState } from "react";
export type ParameterDefinition = {
  key: string;
  name: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  integer?: boolean;
  geometry?: boolean;
};
export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  label,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  id?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const errorId = useId();
  const validate = (raw: string) =>
    !raw.trim() || !Number.isFinite(Number(raw))
      ? "请输入有限数值。"
      : Number(raw) < min || Number(raw) > max
        ? `请输入 ${min} 至 ${max} 之间的数值。`
        : "";
  return (
    <>
      <input
        id={id}
        type="number"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        aria-invalid={draft !== null && !!validate(draft)}
        aria-describedby={error ? errorId : undefined}
        value={draft ?? value}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(validate(e.target.value));
          const n = Number(e.target.value);
          if (e.target.value.trim() && Number.isFinite(n) && n >= min && n <= max) onChange(n);
        }}
        onBlur={() => {
          if (draft !== null && draft.trim() && Number.isFinite(Number(draft))) {
            onChange(Math.min(max, Math.max(min, Number(draft))));
            if (validate(draft)) setError(`${validate(draft)}已调整到允许范围。`);
          } else if (draft !== null) setError("请输入有限数值，已保留原值。");
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(null);
            setError("");
          }
        }}
      />
      {error && (
        <span className="number-field-error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </>
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
        {d.name} <ScriptText text={d.symbol} />
      </span>
      <NumberField
        value={value}
        onChange={(v) => onChange(d.integer ? Math.round(v) : v)}
        min={d.min}
        max={d.max}
        step={d.step}
        label={`${d.name}数值`}
      />
      <span>
        <ScriptText text={d.unit} />
      </span>
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
