"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type ImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
};

export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt = "Story illustration",
}: ImageLightboxProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!src || !open) setImageLoaded(false);
  }, [src, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent animateFromCenter forceCentered className="w-full p-0 border-0 bg-transparent overflow-hidden [&_.dialog-body]:p-0 [&_.dialog-body]:flex [&_.dialog-body]:items-center [&_.dialog-body]:justify-center [&_.dialog-body]:min-h-[50vh]">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {src && (
          <>
            {!imageLoaded && (
              <Skeleton className="w-full max-w-3xl aspect-square max-h-[70vh] rounded-lg shrink-0" />
            )}
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
              onLoad={() => setImageLoaded(true)}
              style={{ display: imageLoaded ? "block" : "none" }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
