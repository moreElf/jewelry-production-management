import Link from "next/link";
import type { ReactNode } from "react";

import { NAV_ITEMS } from "@/lib/constants";

import "./globals.css";

export const metadata = {
  title: "Jewelry MES",
  description: "Jewelry manufacturing management MVP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div>
              <p className="eyebrow">Jewelry MES</p>
              <h1>Production Control</h1>
              <p className="sidebar-copy">
                Shared visibility for workshop orders, rework, and delivery commitments.
              </p>
            </div>
            <nav className="nav-list" aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
