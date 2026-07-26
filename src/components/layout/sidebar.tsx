"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-language";
import {
  BarChart3,
  Package,
  Users,
  GitBranch,
  Filter,
  Bell,
  TrendingUp,
  Settings,
  Share2,
  Megaphone,
} from "lucide-react";
import type { Translations } from "@/lib/i18n/translations";

const navItems: { href: string; key: keyof Translations["nav"]; icon: typeof BarChart3 }[] = [
  { href: "/analytics", key: "analytics", icon: BarChart3 },
  { href: "/products", key: "products", icon: Package },
  { href: "/customers", key: "customers", icon: Users },
  { href: "/channels", key: "channels", icon: GitBranch },
  { href: "/ads", key: "ads", icon: Megaphone },
  { href: "/funnel", key: "funnel", icon: Filter },
  { href: "/alerts", key: "alerts", icon: Bell },
  { href: "/forecast", key: "forecast", icon: TrendingUp },
  { href: "/social-media", key: "socialMedia", icon: Share2 },
  { href: "/settings", key: "settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/analytics" className="flex items-center gap-2 font-semibold text-lg">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <span>IdeaMax</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t.nav[item.key]}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
