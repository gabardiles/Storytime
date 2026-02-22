"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2Icon, BookOpenIcon, XIcon } from "lucide-react";
import { formatTonesForDisplay } from "@/lib/tones";
import { useLanguage } from "@/lib/LanguageContext";

const COVER_PALETTES: { bg: string }[] = [
  { bg: "#2B3A67" },
  { bg: "#D35F49" },
  { bg: "#5B8C5A" },
  { bg: "#E8AA42" },
  { bg: "#7B68AE" },
  { bg: "#E07A52" },
  { bg: "#4A90A4" },
  { bg: "#C4A882" },
  { bg: "#2D4A3E" },
  { bg: "#8B5E83" },
  { bg: "#D4836B" },
  { bg: "#3B6B8A" },
];

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

type Story = {
  id: string;
  title: string | null;
  tone: string;
  length_key: string;
  status: string;
  created_at: string;
  context_json: Record<string, unknown> | null;
};

function BookContent({
  story,
  onStartReading,
  onDelete,
  hasImageBackground = false,
}: {
  story: Story;
  onStartReading: () => void;
  onDelete: () => void;
  hasImageBackground?: boolean;
}) {
  const { t, locale } = useLanguage();
  const ctx = story.context_json ?? {};
  const summary = (ctx.summary as string) ?? "";
  const title = story.title ?? `${t("bookDetails.storyFallback")} ${story.id.slice(0, 8)}`;

  const textClasses = hasImageBackground
    ? "text-white [&_*]:text-white/90"
    : "";

  return (
    <>
      <h2 className={`text-xl font-semibold leading-tight ${textClasses}`}>
        {title}
      </h2>

      {summary && (
        <p
          className={`text-sm leading-relaxed mt-2 ${
            hasImageBackground ? "text-white/90" : "text-muted-foreground"
          }`}
        >
          {summary}
        </p>
      )}

      <div
        className={`flex items-center gap-3 text-xs mt-3 ${
          hasImageBackground ? "text-white/80" : "text-muted-foreground"
        }`}
      >
        <span>{formatTonesForDisplay(story.tone)}</span>
        <span>·</span>
        <span>{story.length_key}</span>
        <span>·</span>
        <span>{new Date(story.created_at).toLocaleDateString(locale === "es" ? "es-ES" : locale === "sv" ? "sv-SE" : "en-US")}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className={
            hasImageBackground
              ? "text-white/90 hover:bg-white/20 hover:text-white"
              : "text-destructive hover:bg-destructive/10 hover:text-destructive"
          }
        >
          <Trash2Icon className="mr-1.5 size-3.5" />
          {t("bookDetails.delete")}
        </Button>
        <Button
          type="button"
          onClick={onStartReading}
          size="sm"
          className={hasImageBackground ? "bg-white text-black hover:bg-white/90" : ""}
        >
          <BookOpenIcon className="mr-1.5 size-3.5" />
          {t("bookDetails.startReading")}
        </Button>
      </div>
    </>
  );
}

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
  const { t } = useLanguage();
  const coverImageUrl = story.context_json?.coverImageUrl as string | undefined;
  const hasImage = !!coverImageUrl;
  const palette = COVER_PALETTES[hashStr(story.id) % COVER_PALETTES.length];

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
      <div
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`fixed inset-0 z-50 w-full max-w-full border-0 shadow-2xl transition-transform duration-300 ease-out overflow-hidden sm:right-0 sm:top-0 sm:bottom-0 sm:left-auto sm:w-[85vw] sm:max-w-sm sm:border-l ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal={open}
      >
        <div className="relative h-full w-full flex flex-col animate-in fade-in duration-200">
          {hasImage ? (
            <img
              src={coverImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover min-h-full min-w-full"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: palette.bg }}
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-sm p-1 text-white/90 hover:text-white transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={t("bookDetails.close")}
          >
            <XIcon className="size-5" />
          </button>
          <div className="relative mt-auto p-5">
            <BookContent
              story={story}
              onStartReading={onStartReading}
              onDelete={onDelete}
              hasImageBackground
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function BookDetailsDialog({
  story,
  open,
  onOpenChange,
  onDelete,
  onOpenStoryModal,
}: {
  story: Story | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  /** When set, "Start reading" opens the story in a modal instead of navigating. */
  onOpenStoryModal?: (storyId: string) => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();

  if (!story) return null;

  const title = story.title ?? `${t("bookDetails.storyFallback")} ${story.id.slice(0, 8)}`;

  function handleStartReading() {
    onOpenChange(false);
    if (onOpenStoryModal) {
      onOpenStoryModal(story!.id);
    } else {
      router.push(`/story/${story!.id}`);
    }
  }

  function handleDelete() {
    if (confirm(t("bookDetails.confirmDelete"))) {
      onDelete(story!.id);
      onOpenChange(false);
    }
  }

  return (
    <>
      <div className="sm:hidden">
        <MobileDrawer
          story={story}
          open={open}
          onClose={() => onOpenChange(false)}
          onStartReading={handleStartReading}
          onDelete={handleDelete}
        />
      </div>

      <div className="hidden sm:block">
        <Dialog open={open} onOpenChange={onOpenChange}>
          {(() => {
            const coverImageUrl = story.context_json?.coverImageUrl as
              | string
              | undefined;
            const hasImage = !!coverImageUrl;
            const palette =
              COVER_PALETTES[hashStr(story.id) % COVER_PALETTES.length];

            return (
              <DialogContent
                animateFromCenter
                className="p-0 overflow-hidden sm:max-w-md aspect-[3/4] min-h-[320px] border-0 [&_.dialog-body]:p-0 [&>button]:text-white [&>button]:opacity-90 [&>button:hover]:opacity-100 [&>button]:bg-transparent [&>button]:border-0"
                aria-describedby={undefined}
              >
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <div className="relative h-full flex flex-col animate-in fade-in duration-200">
                  {hasImage ? (
                    <img
                      src={coverImageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: palette.bg }}
                      aria-hidden
                    />
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
                    aria-hidden
                  />
                  <div className="relative mt-auto p-6">
                    <BookContent
                      story={story}
                      onStartReading={handleStartReading}
                      onDelete={handleDelete}
                      hasImageBackground
                    />
                  </div>
                </div>
              </DialogContent>
            );
          })()}
        </Dialog>
      </div>
    </>
  );
}
