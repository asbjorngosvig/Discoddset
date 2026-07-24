"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Markeder", icon: "🎲" },
  { href: "/me", label: "Mig", icon: "👤" },
  { href: "/leaderboard", label: "Top", icon: "🏆" },
  { href: "/admin", label: "Admin", icon: "🛠️" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/select-player") return null;

  return (
    <nav className="tap-target fixed inset-x-0 bottom-0 z-40 border-t border-felt-700 bg-felt-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                active ? "text-accent-bright" : "text-neutral-500"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
