import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  sizes?: string;
  tone?: "light" | "dark";
};

/**
 * The supplied GIWESA logo is used as-is. Its square JPEG background sits on a
 * white tile so the mark is never stretched or recoloured.
 */
export function Logo({
  className,
  priority = false,
  loading,
  sizes = "96px",
  tone = "light",
}: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] bg-white",
        tone === "dark" && "ring-1 ring-white/15",
        className,
      )}
    >
      <Image
        src="/giwesa-logo.jpg"
        alt="GIWESA Solutions"
        width={640}
        height={640}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : loading}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
