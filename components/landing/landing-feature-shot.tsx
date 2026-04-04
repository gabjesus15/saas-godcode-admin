import Image from "next/image";

import { cn } from "../../utils/cn";

export function LandingFeatureShot({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[16/10] w-full bg-slate-100 dark:bg-zinc-900",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover object-top"
      />
    </div>
  );
}
