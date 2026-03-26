"use client";

import { cn } from "@/lib/utils";
import { toTitle } from "./device-utils";

export function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start py-1 text-sm">
      <span className="font-medium text-muted-foreground text-[13px] w-32 flex-shrink-0">
        {label}
      </span>
      <span
        className={cn(
          mono ? "font-mono" : "font-sans font-normal",
          "text-foreground/90 whitespace-pre-wrap break-words flex-grow min-w-0"
        )}
      >
        {toTitle(value)}
      </span>
    </div>
  );
}
