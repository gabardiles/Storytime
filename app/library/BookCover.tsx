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

/* ── Kids-friendly cover palette – richer, more playful ── */
const COVER_PALETTES: { bg: string; text: string; spine: string }[] = [
  { bg: "#2B3A67", text: "#F8F0E3", spine: "#1E2A4F" }, // deep navy
  { bg: "#D35F49", text: "#FFF8F0", spine: "#B04A38" }, // warm red
  { bg: "#5B8C5A", text: "#FAFDF8", spine: "#487048" }, // forest green
  { bg: "#E8AA42", text: "#2C2418", spine: "#C48E2E" }, // golden yellow
  { bg: "#7B68AE", text: "#F5F0FF", spine: "#635092" }, // soft purple
  { bg: "#E07A52", text: "#FFF8F0", spine: "#C06340" }, // coral orange
  { bg: "#4A90A4", text: "#F0F8FA", spine: "#3A7488" }, // teal
  { bg: "#C4A882", text: "#2C2418", spine: "#A8906C" }, // warm beige
  { bg: "#2D4A3E", text: "#F0F8F4", spine: "#1F3830" }, // dark sage
  { bg: "#8B5E83", text: "#FFF5FC", spine: "#724A6C" }, // dusty plum
  { bg: "#D4836B", text: "#FFF8F0", spine: "#B86D58" }, // peachy
  { bg: "#3B6B8A", text: "#F0F6FA", spine: "#2E5570" }, // ocean blue
];

/** Spine width in px – the hardcover binding edge */
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

/* ── Size variants – front-facing covers ── */
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

/* ── Cover style: image with overlay, or solid color ── */
type CoverStyle = "image-dark" | "image-light" | "color";

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

  const coverStyles: CoverStyle[] = ["image-dark", "image-dark", "image-light", "image-light", "color"];
  const coverStyle: CoverStyle = coverImageUrl
    ? coverStyles[hash % 5]
    : "color";
  const useImage = coverImageUrl && coverStyle !== "color";
  const isDarkOverlay = coverStyle === "image-dark";

  const title = story.title ?? `Story ${story.id.slice(0, 8)}`;
  const displayTitle = title.length > 30 ? `${title.slice(0, 28)}...` : title;
  const toneDisplay = formatTonesForDisplay(story.tone);
  const lang = (story.context_json?.language as string) ?? "en";
  const langLabel = lang === "sv" ? "SWEDISH" : "ENGLISH";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "book-cover group relative flex-shrink-0 cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
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
      {/* ── Hardcover spine edge (left side) ── */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-[3px]"
        style={{
          width: SPINE_W,
          background: `linear-gradient(to right,
            ${palette.spine} 0%,
            ${palette.spine} 40%,
            rgba(0,0,0,0.15) 100%)`,
          boxShadow: `
            inset -1px 0 2px rgba(0,0,0,0.2),
            inset 1px 0 1px rgba(255,255,255,0.08)
          `,
        }}
      />

      {/* ── Front cover ── */}
      <div
        className="absolute top-0 bottom-0 rounded-r-sm overflow-hidden"
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
        {useImage && (
          <>
            <img
              src={coverImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: isDarkOverlay
                  ? "rgba(0,0,0,0.75)"
                  : "rgba(255,255,255,0.78)",
              }}
              aria-hidden
            />
          </>
        )}
      </div>

      {/* ── Spine-to-cover crease line ── */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: SPINE_W - 1,
          width: 3,
          background: `linear-gradient(to right,
            rgba(0,0,0,0.18) 0%,
            rgba(0,0,0,0.06) 50%,
            rgba(255,255,255,0.06) 100%)`,
        }}
      />

      {/* ── Cover surface gradient (curvature/light) ── */}
      <div
        className="absolute top-0 bottom-0 rounded-r-sm pointer-events-none"
        style={{
          left: SPINE_W,
          right: 0,
          background: useImage
            ? "linear-gradient(to right, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)"
            : `linear-gradient(to right,
                rgba(255,255,255,0.12) 0%,
                rgba(255,255,255,0) 25%,
                rgba(0,0,0,0.04) 60%,
                rgba(0,0,0,0.1) 100%)`,
        }}
      />

      {/* ── Title & tone content ── */}
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center gap-1 py-4 text-center",
          useImage && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        )}
        style={{
          color: useImage
            ? isDarkOverlay
              ? "#F8F0E3"
              : "#1a1a1a"
            : palette.text,
          paddingLeft: SPINE_W + 8,
          paddingRight: 8,
        }}
      >
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
        <div className="mt-auto flex flex-col items-center gap-0.5">
          <span
            className={cn(
              "uppercase tracking-[0.15em] font-sans",
              useImage ? "opacity-80" : "opacity-40",
              size.subtitleSize
            )}
          >
            {langLabel}
          </span>
          <span
            className={cn(
              "uppercase tracking-widest font-sans",
              useImage ? "opacity-90" : "opacity-50",
              size.subtitleSize
            )}
          >
            {toneDisplay}
          </span>
        </div>
      </div>

      {/* ── Bottom page-edge strip ── */}
      <div
        className="absolute bottom-0 right-0 h-[3px] rounded-br-sm"
        style={{
          left: SPINE_W,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.12))",
        }}
      />
    </button>
  );
}
