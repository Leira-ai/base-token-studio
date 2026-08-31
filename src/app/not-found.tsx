import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-6xl font-semibold text-accent/40">404</p>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">
        This page was never minted
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        The address you requested does not exist on this site — unlike a
        blockchain, nothing here is immutable.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent/85"
      >
        Back to the studio
      </Link>
    </main>
  );
}
