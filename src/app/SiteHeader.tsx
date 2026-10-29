import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Room<span className="text-accent">Craft</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/rooms/bedroom" className="hover:text-foreground">
            Showrooms
          </Link>
          <Link href="/designer" className="hover:text-foreground">
            Room designer
          </Link>
        </nav>
      </div>
    </header>
  );
}
