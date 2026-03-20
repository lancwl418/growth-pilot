"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Menu, LogOut, Bell, RefreshCw, Languages } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNav } from "./mobile-nav";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useLanguage, useT } from "@/hooks/use-language";
import { formatDistanceToNow } from "date-fns";

interface StatusData {
  lastSync: { source: string; completedAt: string; records: number } | null;
  activeAlerts: number;
}

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const { data: status } = useDashboardData<StatusData>("/api/dashboard/status");
  const { locale, setLocale } = useLanguage();
  const t = useT();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <MobileNav />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Sync status */}
      {status?.lastSync && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span>
                {t.common.synced}{" "}
                {formatDistanceToNow(new Date(status.lastSync.completedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {status.lastSync.source}: {status.lastSync.records} records
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Language toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocale(locale === "en" ? "zh" : "en")}
          >
            <Languages className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{locale === "en" ? "切换中文" : "Switch to English"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Alert badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/alerts">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {status && status.activeAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {status.activeAlerts > 9 ? "9+" : status.activeAlerts}
                </span>
              )}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {status?.activeAlerts
              ? t.alerts.activeCount(status.activeAlerts)
              : t.alerts.noActiveAlerts}
          </p>
        </TooltipContent>
      </Tooltip>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                <AvatarFallback>
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center gap-2 p-2">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" />
              {t.common.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
