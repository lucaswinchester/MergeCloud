"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      expand
      toastOptions={{
        className: "z-[9999]",
      }}
    />
  );
}
