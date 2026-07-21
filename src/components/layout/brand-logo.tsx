import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  inverted?: boolean;
  /** Larger mark for hero compositions */
  size?: "sm" | "md" | "lg" | "hero";
}

const sizes = {
  sm: { width: 140, height: 32, className: "h-6 w-auto sm:h-7" },
  md: { width: 160, height: 48, className: "h-8 w-auto sm:h-9" },
  lg: { width: 220, height: 66, className: "h-10 w-auto sm:h-12" },
  hero: { width: 360, height: 108, className: "h-14 w-auto sm:h-20 md:h-24" },
} as const;

export function BrandLogo({
  className,
  inverted = false,
  size = "md",
}: BrandLogoProps) {
  const s = sizes[size];
  const src = inverted ? "/logos/white.png" : "/logos/black.png";

  return (
    <Image
      src={src}
      alt="koukibeauty academy"
      width={s.width}
      height={s.height}
      className={cn(s.className, "object-contain object-right", className)}
      priority={size === "hero" || size === "md"}
    />
  );
}
