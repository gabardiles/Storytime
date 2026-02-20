"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatTonesForDisplay } from "@/lib/tones";

/* ── WCAG AA contrast: 4.5:1 for normal text ── */
const AA_CONTRAST = 4.5;
const IMAGE_TEXT_COLOR = "#F8F0E3";

/** Relative luminance (0–1) from sRGB hex. */
function hexToLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Contrast ratio between two luminances (WCAG). */
function contrastRatio(L1: number, L2: number): number {
  const [light, dark] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Sample image region (top or bottom) and return average luminance, or null if unmeasurable (e.g. CORS).
 */
function sampleImageLuminance(
  imageUrl: string,
  placement: number
): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 64;
        const h = Math.max(32, Math.round(64 * (img.height / img.width)));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        // Draw cover-style (fill and crop center)
        const scale = Math.max(w / img.width, h / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
        const bandHeight = Math.max(1, Math.floor(h * 0.35));
        const y0 = placement === 0 ? 0 : h - bandHeight;
        const data = ctx.getImageData(0, y0, w, bandHeight).data;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const [rs, gs, bs] = [r, g, b].map((c) =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
          );
          sum += 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
          count += 1;
        }
        resolve(count > 0 ? sum / count : null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/* ── Kid-friendly sans-serif fonts (from layout.tsx) ── */
const BOOK_FONTS = [
  "var(--font-book-1)", // Nunito
  "var(--font-book-2)", // Quicksand
  "var(--font-book-3)", // Fredoka
  "var(--font-book-4)", // Lexend
  "var(--font-book-5)", // Baloo 2
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

/* Mobile: 3 books per row on ~390px (16px main + 6px shelf each side, 3 books + 2×8px gap → ~102px cover) */
const SIZES: Record<SizeVariant, SizeDef> = {
  small:  { w: 105, h: 140, mobileW: 96,  mobileH: 128, titleSize: "sm:text-xs",   mobileTitleSize: "text-[10px]", subtitleSize: "text-[8px]" },
  medium: { w: 130, h: 175, mobileW: 99,  mobileH: 133, titleSize: "sm:text-sm",   mobileTitleSize: "text-[11px]", subtitleSize: "text-[9px]" },
  large:  { w: 148, h: 200, mobileW: 102, mobileH: 137, titleSize: "sm:text-base", mobileTitleSize: "text-xs",     subtitleSize: "text-[9px]" },
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

  /* Placement: top or bottom only (0 = top, 1 = bottom) */
  const placement = hash % 2;
  /* Variant: image on top half, title below on solid color (same palette as no-image covers) */
  const imageTopTitleBelow = hasImage && ((hash >> 1) % 2 === 0);
  /* When image has AA contrast with text, no overlay/strip needed */
  const [passesAA, setPassesAA] = useState<boolean | null>(null);
  useEffect(() => {
    if (!hasImage || !coverImageUrl || imageTopTitleBelow) {
      setPassesAA(null);
      return;
    }
    let cancelled = false;
    sampleImageLuminance(coverImageUrl, placement).then((lum) => {
      if (cancelled) return;
      if (lum == null) {
        setPassesAA(false);
        return;
      }
      const textLum = hexToLuminance(IMAGE_TEXT_COLOR);
      const ratio = contrastRatio(lum, textLum);
      setPassesAA(ratio >= AA_CONTRAST);
    });
    return () => {
      cancelled = true;
    };
  }, [hasImage, coverImageUrl, placement, imageTopTitleBelow]);

  const needsOverlay = hasImage && !imageTopTitleBelow && passesAA !== true;

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
        {/* Cover image: full-bleed or top-half only (title below variant) */}
        {hasImage && (
          <img
            src={coverImageUrl}
            alt=""
            className={cn(
              "absolute w-full object-cover left-0 right-0",
              imageTopTitleBelow ? "top-0 h-[55%]" : "inset-0 h-full"
            )}
          />
        )}
        {/* Bottom color band for "image on top, title below" variant */}
        {imageTopTitleBelow && (
          <>
            <div
              className="absolute inset-x-0 h-[3px]"
              style={{ top: "55%", backgroundColor: palette.accent }}
              aria-hidden
            />
            <div
              className="absolute inset-x-0 bottom-0 rounded-br-md"
              style={{ top: "calc(55% + 3px)", backgroundColor: palette.bg }}
              aria-hidden
            />
          </>
        )}

        {/* ── Inner decorative frame (inset border) ── */}
        <div
          className="absolute pointer-events-none rounded-r-md"
          style={{
            inset: hasImage ? 4 : 6,
            border: hasImage && !imageTopTitleBelow
              ? "1.5px solid rgba(255,255,255,0.35)"
              : `2px solid ${palette.accent}40`,
            borderRadius: 4,
          }}
          aria-hidden
        />

        {/* ── Gradient for title readability only when contrast is below AA; top or bottom only ── */}
        {needsOverlay && (
          <div
            className="absolute inset-x-0 w-full"
            style={{
              height: "50%",
              ...(placement === 0
                ? { top: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)" }
                : { bottom: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)" }),
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
      {imageTopTitleBelow ? (
        /* Variant: image on top, title below on solid color band (same palette as no-image) */
        <div
          className="relative flex h-full w-full flex-col items-center justify-end text-center"
          style={{
            color: palette.text,
            paddingLeft: SPINE_W + 10,
            paddingRight: 10,
            paddingTop: 8,
            paddingBottom: 10,
          }}
        >
          <div className="flex flex-col items-center gap-0.5 w-full">
            {toneDisplay ? (
              <span
                className={cn(
                  "uppercase tracking-[0.12em] font-sans opacity-70",
                  size.subtitleSize
                )}
              >
                {toneDisplay}
              </span>
            ) : null}
            <span
              className={cn(
                "font-bold line-clamp-2 leading-[1]",
                size.mobileTitleSize,
                size.titleSize
              )}
              style={{ fontFamily, color: palette.text }}
            >
              {displayTitle}
            </span>
          </div>
        </div>
      ) : hasImage ? (
        /* Image full-bleed: theme above title; placement top or bottom only */
        <div
          className={cn(
            "relative flex h-full w-full flex-col text-center",
            placement === 0 && "justify-start",
            placement === 1 && "justify-end"
          )}
          style={{
            paddingLeft: SPINE_W + 8,
            paddingRight: 6,
            paddingBottom: 8,
            paddingTop: 8,
          }}
        >
          <div className="space-y-0.5">
            {toneDisplay ? (
              <span
                className={cn(
                  "block uppercase tracking-[0.15em] font-sans opacity-80",
                  size.subtitleSize
                )}
                style={{
                  color: "#F8F0E3",
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
              >
                {toneDisplay}
              </span>
            ) : null}
            <span
              className={cn(
                "block font-bold line-clamp-3 leading-[1]",
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
          </div>
        </div>
      ) : (
        /* Color-only cover: theme above title; placement top or bottom only */
        <div
          className={cn(
            "relative flex h-full w-full flex-col items-center gap-1 text-center",
            placement === 0 && "justify-start",
            placement === 1 && "justify-end"
          )}
          style={{
            color: palette.text,
            paddingLeft: SPINE_W + 10,
            paddingRight: 10,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="currentColor"
            className="opacity-40 mb-1 flex-shrink-0"
            aria-hidden="true"
          >
            <path d="M7 0l1.8 5.2H14l-4.2 3L11.5 14 7 10.7 2.5 14l1.7-5.8L0 5.2h5.2z" />
          </svg>

          {toneDisplay ? (
            <span
              className={cn(
                "uppercase tracking-[0.12em] font-sans italic opacity-70",
                size.subtitleSize
              )}
            >
              {toneDisplay}
            </span>
          ) : null}

          <span
            className={cn(
              "font-bold line-clamp-3 leading-[1]",
              size.mobileTitleSize,
              size.titleSize
            )}
            style={{ fontFamily, color: palette.text }}
          >
            {displayTitle}
          </span>

          <div className="flex items-center gap-1 opacity-40 my-0.5 flex-shrink-0" aria-hidden>
            <span className="inline-block w-2 h-px rounded-full" style={{ backgroundColor: palette.accent }} />
            <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
              <circle cx="3" cy="3" r="2" />
            </svg>
            <span className="inline-block w-2 h-px rounded-full" style={{ backgroundColor: palette.accent }} />
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
