"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2Icon, BookOpenIcon, XIcon } from "lucide-react";
import { formatTonesForDisplay } from "@/lib/tones";

type Story = {
  id: string;
  title: string | null;
  tone: string;
  length_key: string;
  status: string;
  created_at: string;
  context_json: Record<string, unknown> | null;
};

/* ── Shared content used by both drawer and dialog ── */
function BookContent({
  story,
  onStartReading,
  onDelete,
}: {
  story: Story;
  onStartReading: () => void;
  onDelete: () => void;
}) {
  const ctx = story.context_json ?? {};
  const summary = (ctx.summary as string) ?? "";
  const title = story.title ?? `Story ${story.id.slice(0, 8)}`;

  return (
    <>
      <h2 className="text-xl font-semibold leading-tight">{title}</h2>

      {summary && (
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          {summary}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
        <span>{formatTonesForDisplay(story.tone)}</span>
        <span>·</span>
        <span>{story.length_key}</span>
        <span>·</span>
        <span>{new Date(story.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon className="mr-1.5 size-3.5" />
          Delete
        </Button>
        <Button type="button" onClick={onStartReading} size="sm">
          <BookOpenIcon className="mr-1.5 size-3.5" />
          Start reading
        </Button>
      </div>
    </>
  );
}

/* ── Mobile side drawer ── */
function MobileDrawer({
  story,
  open,
  onClose,
  onStartReading,
  onDelete,
}: {
  story: Story;
  open: boolean;
  onClose: () => void;
  onStartReading: () => void;
  onDelete: () => void;
}) {
  /* Lock body scroll when drawer is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel – slides in from right */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-[85vw] max-w-sm bg-background border-l shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal={open}
      >
        <div className="flex flex-col h-full p-5">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-1 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close"
            >
              <XIcon className="size-5" />
            </button>
          </div>

          <BookContent
            story={story}
            onStartReading={onStartReading}
            onDelete={onDelete}
          />
        </div>
      </div>
    </>
  );
}

/* ── Main export ── */
export default function BookDetailsDialog({
  story,
  open,
  onOpenChange,
  onDelete,
}: {
  story: Story | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  if (!story) return null;

  const title = story.title ?? `Story ${story.id.slice(0, 8)}`;
  const ctx = story.context_json ?? {};
  const summary = (ctx.summary as string) ?? "";

  function handleStartReading() {
    onOpenChange(false);
    router.push(`/story/${story!.id}`);
  }

  function handleDelete() {
    if (confirm("Delete this story?")) {
      onDelete(story!.id);
      onOpenChange(false);
    }
  }

  return (
    <>
      {/* Mobile: side drawer */}
      <div className="sm:hidden">
        <MobileDrawer
          story={story}
          open={open}
          onClose={() => onOpenChange(false)}
          onStartReading={handleStartReading}
          onDelete={handleDelete}
        />
      </div>

      {/* Desktop: centered dialog */}
      <div className="hidden sm:block">
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              {summary && (
                <DialogDescription className="text-left text-sm leading-relaxed">
                  {summary}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatTonesForDisplay(story.tone)}</span>
              <span>·</span>
              <span>{story.length_key}</span>
              <span>·</span>
              <span>{new Date(story.created_at).toLocaleDateString()}</span>
            </div>

            <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2Icon className="mr-1.5 size-3.5" />
                Delete
              </Button>
              <Button type="button" onClick={handleStartReading} size="sm">
                <BookOpenIcon className="mr-1.5 size-3.5" />
                Start reading
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
