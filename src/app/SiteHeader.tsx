import Link from "next/link";
import Logo from "./Logo";

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight" aria-label="RoomCraft home">
          <Logo size={28} />
          <span>
            Room<span className="text-accent">Craft</span>
          </span>
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
