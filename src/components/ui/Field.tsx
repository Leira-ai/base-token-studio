import type { ReactNode } from "react";

/**
 * In-context education: a one-line "why" shown under the label. Token-creator
 * competitors ask for numbers without explaining them; these tooltips teach
 * decimals, gas, and supply at the moment of confusion.
 */
export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  learn,
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
  /** Evergreen explainer rendered as a title tooltip on the label. */
  learn?: string;
  trailing?: ReactNode;
  disabled?: boolean;
  inputMode?: "text" | "decimal";
  mono?: boolean;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-medium text-ink-muted"
          title={learn}
        >
          {label}
          {learn ? (
            <span
              aria-hidden
              className="ml-1.5 cursor-help rounded-full border border-border-subtle px-1.5 text-[10px] leading-4 text-ink-muted"
            >
              ?
            </span>
          ) : null}
        </label>
        {hint && !error ? (
          <span id={`${id}-hint`} className="text-xs text-ink-muted">
            {hint}
          </span>
        ) : null}
      </div>

      <div
        className={`flex items-center gap-2 rounded-lg border bg-surface-raised px-3 transition-colors focus-within:border-accent/70 ${
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
          className={`w-full bg-transparent py-2.5 text-sm outline-none focus:outline-none focus:ring-0 placeholder:text-ink-muted/60 disabled:cursor-not-allowed ${
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
