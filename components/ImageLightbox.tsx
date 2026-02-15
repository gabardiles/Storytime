"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent overflow-hidden">
        {src && (
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
