"use client";

import { cn } from "@/lib/utils";

/**
 * Decorative shelf objects placed between books.
 * Inspired by reference: sculptures, vases, frames, rings, dried flowers.
 * Deterministic from `seed` for stable layout.
 */

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const DECO_TYPES = [
  "sculpture",
  "vase",
  "frame",
  "ring",
  "postcard",
] as const;
type DecoType = (typeof DECO_TYPES)[number];

export default function DecorativeObject({
  seed,
  index,
}: {
  seed: string;
  index: number;
}) {
  const h = hashStr(seed + index);
  const type: DecoType = DECO_TYPES[h % DECO_TYPES.length];

  const base = "flex-shrink-0 pointer-events-none select-none flex items-end";

  /* Sculpture – abstract white/stone shapes like the reference */
  if (type === "sculpture") {
    return (
      <div className={cn(base)} style={{ width: 30, height: 80 }}>
        <div className="flex flex-col items-center">
          {/* Head */}
          <div
            className="rounded-full"
            style={{
              width: 14,
              height: 16,
              background: "#E8E2DA",
              boxShadow: "1px 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          {/* Neck */}
          <div style={{ width: 6, height: 8, background: "#E0D9D0" }} />
          {/* Body */}
          <div
            className="rounded-t-full"
            style={{
              width: 16,
              height: 28,
              background: "linear-gradient(to bottom, #E8E2DA, #D6CFC5)",
              boxShadow: "1px 3px 6px rgba(0,0,0,0.1)",
            }}
          />
          {/* Base */}
          <div
            className="rounded-sm"
            style={{
              width: 20,
              height: 6,
              background: "#CCC5BB",
            }}
          />
        </div>
      </div>
    );
  }

  /* Vase – dark cylinder with subtle sheen */
  if (type === "vase") {
    const dark = h % 2 === 0;
    return (
      <div className={cn(base)} style={{ width: 28, height: 65 }}>
        <div className="flex flex-col items-center">
          {/* Rim */}
          <div
            className="rounded-full"
            style={{
              width: 16,
              height: 4,
              background: dark ? "#3A3A3A" : "#B8A898",
            }}
          />
          {/* Body */}
          <div
            style={{
              width: 20,
              height: 38,
              borderRadius: "4px 4px 6px 6px",
              background: dark
                ? "linear-gradient(to right, #2C2C2C, #444, #2C2C2C)"
                : "linear-gradient(to right, #C4B5A4, #D9CCBC, #C4B5A4)",
              boxShadow: "2px 4px 8px rgba(0,0,0,0.15)",
            }}
          />
        </div>
      </div>
    );
  }

  /* Frame – small dark or light picture frame leaning slightly */
  if (type === "frame") {
    const isDark = h % 3 === 0;
    return (
      <div className={cn(base)} style={{ width: 44, height: 60 }}>
        <div
          className="rounded-sm"
          style={{
            width: 40,
            height: 52,
            border: `2px solid ${isDark ? "#333" : "#C4B5A4"}`,
            background: isDark ? "#1A1A1A" : "#F5F0E8",
            boxShadow: "2px 4px 10px rgba(0,0,0,0.12)",
            transform: "rotate(-2deg)",
          }}
        >
          <div
            className="mx-auto mt-2 rounded-sm"
            style={{
              width: 28,
              height: 34,
              background: isDark
                ? "linear-gradient(135deg, #333, #555)"
                : "rgba(0,0,0,0.04)",
            }}
          />
        </div>
      </div>
    );
  }

  /* Ring – wooden/ceramic ring standing up */
  if (type === "ring") {
    return (
      <div className={cn(base)} style={{ width: 34, height: 40 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "5px solid #C4A882",
            background: "transparent",
            boxShadow: "2px 3px 6px rgba(0,0,0,0.12)",
          }}
        />
      </div>
    );
  }

  /* Postcard – tilted card */
  return (
    <div className={cn(base)} style={{ width: 42, height: 60 }}>
      <div
        className="rounded-sm"
        style={{
          width: 38,
          height: 50,
          background: "linear-gradient(135deg, #F5F0E8 0%, #E8E0D4 100%)",
          transform: "rotate(-3deg)",
          boxShadow: "2px 3px 8px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="mx-auto mt-2 rounded-sm"
          style={{ width: 26, height: 18, background: "rgba(0,0,0,0.05)" }}
        />
        <div className="mx-auto mt-1.5 space-y-0.5 px-2">
          <div className="h-[1.5px] rounded-full bg-black/8" />
          <div className="h-[1.5px] w-3/4 rounded-full bg-black/8" />
        </div>
      </div>
    </div>
  );
}
