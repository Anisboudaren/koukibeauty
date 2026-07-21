import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

const links = [
  { href: "/courses", label: "الدورات" },
  { href: "/dashboard", label: "لوحة الطالبة" },
  { href: "/privacy", label: "الخصوصية والشروط" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-blush-deep/20 bg-[#1a1214] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <BrandLogo inverted size="lg" />
          <p className="max-w-xs text-sm leading-relaxed text-white/55">
            أكاديمية متخصصة في تعليم فنون الجمال — شعر، مكياج، وعناية —
            من المنزل إلى الاحتراف.
          </p>
        </div>

        <nav className="flex flex-wrap gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 text-xs text-white/40 sm:px-6">
          <p>© {new Date().getFullYear()} koukibeauty academy</p>
          <p>صُنع بحب للجمال</p>
        </div>
      </div>
    </footer>
  );
}
