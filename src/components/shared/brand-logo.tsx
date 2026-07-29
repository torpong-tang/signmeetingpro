import Image from "next/image";
import { cn } from "@/lib/utils";
import { appPath } from "@/lib/app-path";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-black",
        className,
      )}
    >
      <Image
        src={appPath("/images/signmeetingpro-logo.png")}
        alt="SignMeetingPro - Modern solutions for professional meetings"
        fill
        priority={priority}
        sizes="(max-width: 640px) 190px, 360px"
        className="object-cover object-center"
      />
    </div>
  );
}
