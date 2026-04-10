"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
const navItems: { href: Route; label: string }[] = [
  { href: "/" as Route, label: "Home" },
  { href: "/search" as Route, label: "Search" },
  { href: "/graph" as Route, label: "Graph" },
  { href: "/timeline" as Route, label: "Timeline" },
];

export function TopNavigation() {
  const pathname = usePathname();

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link href="/" className="top-nav-brand">
          <span className="top-nav-brand-mark" aria-hidden>
            M
          </span>
          <span>Map of Math</span>
        </Link>

        <nav className="top-nav-links" aria-label="Primary">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`top-nav-link ${isActive ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
