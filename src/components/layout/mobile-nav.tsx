"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BookOpen, Home, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLms } from "@/lib/lms/use-lms";

export function MobileNav() {
  const pathname = usePathname();
  const { state } = useLms();

  const role = state?.session?.role;

  const items =
    role === "admin"
      ? [
          { href: "/admin", label: "الإدارة", icon: LayoutDashboard },
          { href: "/admin/orders", label: "الطلبات", icon: BookOpen },
          { href: "/courses", label: "الدورات", icon: BookOpen },
        ]
      : [
          { href: "/dashboard", label: "لوحتي", icon: Home },
          { href: "/courses", label: "الدورات", icon: BookOpen },
          { href: "/dashboard/certificates", label: "الشهادات", icon: Award },
          { href: "/dashboard/requests", label: "طلباتي", icon: LayoutDashboard },
        ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white safe-bottom md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-medium transition",
                active ? "text-accent" : "text-black/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
