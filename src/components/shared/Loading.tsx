"use client";

import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="py-16 sm:py-20 w-full h-full grid place-items-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
