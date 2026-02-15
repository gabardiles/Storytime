"use client";

import { cn } from "@/lib/utils";
import { formatTonesForDisplay } from "@/lib/tones";

/* ── Fonts assigned via CSS variables from layout.tsx ── */
const BOOK_FONTS = [
  "var(--font-book-1)", // Playfair Display
  "var(--font-book-2)", // Bebas Neue
  "var(--font-book-3)", // Cormorant Garamond
  "var(--font-book-4)", // Oswald
  "var(--font-book-5)", // Libre Baskerville
];

/* ── Kids-friendly cover palette ── */
const COVER_PALETTES: { bg: string; text: string; spine: string; accent: string }[] = [
  { bg: "#2B3A67", text: "#F8F0E3", spine: "#1E2A4F", accent: "#E8AA42" },
  { bg: "#D35F49", text: "#FFF8F0", spine: "#B04A38", accent: "#F8D49A" },
  { bg: "#5B8C5A", text: "#FAFDF8", spine: "#487048", accent: "#E8D5A3" },
  { bg: "#E8AA42", text: "#2C2418", spine: "#C48E2E", accent: "#5B8C5A" },
  { bg: "#7B68AE", text: "#F5F0FF", spine: "#635092", accent: "#E8AA42" },
  { bg: "#E07A52", text: "#FFF8F0", spine: "#C06340", accent: "#F8E8D0" },
  { bg: "#4A90A4", text: "#F0F8FA", spine: "#3A7488", accent: "#E8D5A3" },
  { bg: "#C4A882", text: "#2C2418", spine: "#A8906C", accent: "#5B8C5A" },
  { bg: "#2D4A3E", text: "#F0F8F4", spine: "#1F3830", accent: "#E8AA42" },
  { bg: "#8B5E83", text: "#FFF5FC", spine: "#724A6C", accent: "#E8D5A3" },
  { bg: "#D4836B", text: "#FFF8F0", spine: "#B86D58", accent: "#F8E8D0" },
  { bg: "#3B6B8A", text: "#F0F6FA", spine: "#2E5570", accent: "#E8AA42" },
];

/** Spine width in px */
const SPINE_W = 8;

/* ── Deterministic hash ── */
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/* ── Size variants ── */
type SizeVariant = "small" | "medium" | "large";

type SizeDef = {
  w: number;
  h: number;
  mobileW: number;
  mobileH: number;
  titleSize: string;
  mobileTitleSize: string;
  subtitleSize: string;
};

const SIZES: Record<SizeVariant, SizeDef> = {
  small:  { w: 105, h: 140, mobileW: 70,  mobileH: 98,  titleSize: "sm:text-xs",   mobileTitleSize: "text-[10px]", subtitleSize: "text-[8px]" },
  medium: { w: 130, h: 175, mobileW: 80,  mobileH: 112, titleSize: "sm:text-sm",   mobileTitleSize: "text-[11px]", subtitleSize: "text-[9px]" },
  large:  { w: 148, h: 200, mobileW: 88,  mobileH: 125, titleSize: "sm:text-base", mobileTitleSize: "text-xs",     subtitleSize: "text-[9px]" },
};

/* ── Props ── */
type Story = {
  id: string;
  title: string | null;
  tone: string;
  length_key: string;
  status: string;
  created_at: string;
  context_json: Record<string, unknown> | null;
};

export default function BookCover({
  story,
  index,
  onClick,
}: {
  story: Story;
  index: number;
  onClick: () => void;
}) {
  const hash = hashStr(story.id);
  const coverImageUrl = story.context_json?.coverImageUrl as string | undefined;

  const sizeKey: SizeVariant = (["small", "medium", "large"] as const)[hash % 3];
  const size = SIZES[sizeKey];
  const palette = COVER_PALETTES[hash % COVER_PALETTES.length];
  const fontFamily = BOOK_FONTS[index % BOOK_FONTS.length];
  const hasImage = !!coverImageUrl;

  const title = story.title ?? `Story ${story.id.slice(0, 8)}`;
  const displayTitle = title.length > 30 ? `${title.slice(0, 28)}...` : title;
  const toneDisplay = formatTonesForDisplay(story.tone);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "book-cover group relative flex-shrink-0 cursor-pointer transition-transform duration-200 hover:-translate-y-1.5 hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      )}
      style={
        {
          "--book-w-mobile": `${size.mobileW + SPINE_W}px`,
          "--book-h-mobile": `${size.mobileH}px`,
          "--book-w": `${size.w + SPINE_W}px`,
          "--book-h": `${size.h}px`,
        } as React.CSSProperties
      }
      aria-label={`Open "${title}"`}
    >
      {/* ── Hardcover spine ── */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-[3px]"
        style={{
          width: SPINE_W,
          background: `linear-gradient(to right, ${palette.spine} 0%, ${palette.spine} 40%, rgba(0,0,0,0.15) 100%)`,
          boxShadow: "inset -1px 0 2px rgba(0,0,0,0.2), inset 1px 0 1px rgba(255,255,255,0.08)",
        }}
      />

      {/* ── Front cover ── */}
      <div
        className="absolute top-0 bottom-0 rounded-r-md overflow-hidden"
        style={{
          left: SPINE_W,
          right: 0,
          backgroundColor: palette.bg,
          boxShadow: `
            4px 6px 12px rgba(0,0,0,0.25),
            8px 12px 24px rgba(0,0,0,0.18),
            1px 2px 4px rgba(0,0,0,0.12)
          `,
        }}
      >
        {/* Cover image – shown prominently, image IS the cover */}
        {hasImage && (
          <img
            src={coverImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* ── Inner decorative frame (inset border) ── */}
        <div
          className="absolute pointer-events-none rounded-r-md"
          style={{
            inset: hasImage ? 4 : 6,
            border: hasImage
              ? "1.5px solid rgba(255,255,255,0.35)"
              : `2px solid ${palette.accent}40`,
            borderRadius: 4,
          }}
          aria-hidden
        />

        {/* ── Bottom gradient for title readability (image covers only) ── */}
        {hasImage && (
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "65%",
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)",
            }}
            aria-hidden
          />
        )}

        {/* ── Top accent line ── */}
        {!hasImage && (
          <div
            className="absolute top-0 inset-x-0 h-[3px]"
            style={{ backgroundColor: palette.accent }}
            aria-hidden
          />
        )}

        {/* ── Cover curvature gradient ── */}
        <div
          className="absolute inset-0 rounded-r-md pointer-events-none"
          style={{
            background: hasImage
              ? "linear-gradient(to right, rgba(255,255,255,0.04) 0%, transparent 40%, rgba(0,0,0,0.06) 100%)"
              : "linear-gradient(to right, rgba(255,255,255,0.1) 0%, transparent 25%, rgba(0,0,0,0.06) 60%, rgba(0,0,0,0.1) 100%)",
          }}
        />
      </div>

      {/* ── Spine crease ── */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: SPINE_W - 1,
          width: 3,
          background: "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 50%, rgba(255,255,255,0.06) 100%)",
        }}
      />

      {/* ── Title & subtitle content ── */}
      {hasImage ? (
        /* Image cover: title anchored at bottom over gradient */
        <div
          className="relative flex h-full w-full flex-col justify-end text-center"
          style={{
            paddingLeft: SPINE_W + 8,
            paddingRight: 6,
            paddingBottom: 8,
            paddingTop: 8,
          }}
        >
          <span
            className={cn(
              "font-bold leading-tight line-clamp-3",
              size.mobileTitleSize,
              size.titleSize
            )}
            style={{
              fontFamily,
              color: "#F8F0E3",
              textShadow: "0 1px 4px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.4)",
            }}
          >
            {displayTitle}
          </span>
          <span
            className={cn(
              "uppercase tracking-[0.15em] font-sans mt-0.5 opacity-80",
              size.subtitleSize
            )}
            style={{
              color: "#F8F0E3",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            {toneDisplay}
          </span>
        </div>
      ) : (
        /* Color-only cover: centered layout with decorative elements */
        <div
          className="relative flex h-full w-full flex-col items-center justify-center gap-1 text-center"
          style={{
            color: palette.text,
            paddingLeft: SPINE_W + 10,
            paddingRight: 10,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          {/* Small decorative star above title */}
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="currentColor"
            className="opacity-40 mb-1 flex-shrink-0"
            aria-hidden="true"
          >
            <path d="M7 0l1.8 5.2H14l-4.2 3L11.5 14 7 10.7 2.5 14l1.7-5.8L0 5.2h5.2z" />
          </svg>

          <span
            className={cn(
              "font-bold leading-tight line-clamp-3",
              size.mobileTitleSize,
              size.titleSize
            )}
            style={{ fontFamily }}
          >
            {displayTitle}
          </span>

          {/* Decorative divider */}
          <div className="flex items-center gap-1 opacity-40 my-0.5 flex-shrink-0" aria-hidden>
            <span className="inline-block w-2 h-px rounded-full" style={{ backgroundColor: palette.accent }} />
            <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
              <circle cx="3" cy="3" r="2" />
            </svg>
            <span className="inline-block w-2 h-px rounded-full" style={{ backgroundColor: palette.accent }} />
          </div>

          <div className="mt-auto flex flex-col items-center gap-0.5">
            <span
              className={cn(
                "uppercase tracking-[0.12em] font-sans italic opacity-50",
                size.subtitleSize
              )}
            >
              {toneDisplay}
            </span>
          </div>
        </div>
      )}

      {/* ── Bottom page edge ── */}
      <div
        className="absolute bottom-0 right-0 h-[3px] rounded-br-md"
        style={{
          left: SPINE_W,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.12))",
        }}
      />
    </button>
  );
}
