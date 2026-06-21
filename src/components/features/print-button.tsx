"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Tombol cetak/simpan-PDF (memakai dialog cetak bawaan browser — gratis, tanpa dependensi). */
export function PrintButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.print()}
      className={className}
    >
      <Printer size={16} /> Cetak / PDF
    </Button>
  );
}
