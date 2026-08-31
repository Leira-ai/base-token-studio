import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent/85",
  secondary:
    "bg-surface-raised text-ink border border-border-subtle hover:border-accent/60",
  ghost: "text-ink-muted hover:text-ink",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <span
      className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      role="status"
      aria-label={label}
    />
  );
}
