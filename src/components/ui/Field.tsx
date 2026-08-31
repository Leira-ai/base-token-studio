import type { ReactNode } from "react";

export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  trailing,
  disabled,
  inputMode = "text",
  mono = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shown only after the user has entered something, to avoid scolding empty forms. */
  error?: string;
  hint?: ReactNode;
  trailing?: ReactNode;
  disabled?: boolean;
  inputMode?: "text" | "decimal";
  mono?: boolean;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-ink-muted">
          {label}
        </label>
        {hint && !error ? (
          <span id={`${id}-hint`} className="text-xs text-ink-muted">
            {hint}
          </span>
        ) : null}
      </div>

      <div
        className={`flex items-center gap-2 rounded-lg border bg-surface-raised px-3 ${
          error ? "border-negative" : "border-border-subtle"
        }`}
      >
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-muted/60 disabled:cursor-not-allowed ${
            mono ? "font-mono" : ""
          }`}
        />
        {trailing}
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-negative">
          {error}
        </p>
      ) : null}
    </div>
  );
}
