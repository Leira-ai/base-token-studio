"use client";

import { useTheme } from "@/lib/useTheme";
import { Button } from "@/components/ui/Button";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="secondary"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="px-2.5"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <span aria-hidden className="text-sm leading-none">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </Button>
  );
}
