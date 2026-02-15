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
  imageUrl,
}: {
  seed: string;
  index: number;
  imageUrl?: string;
}) {
  const h = hashStr(seed + index);
  const type: DecoType = DECO_TYPES[h % DECO_TYPES.length];

  const base = "flex-shrink-0 pointer-events-none select-none flex items-end";

  /* Sculpture – abstract white/stone shapes like the reference */
  if (type === "sculpture") {
    return (
      <div className={cn(base)} style={{ width: 46, height: 120 }}>
        <div className="flex flex-col items-center">
          {/* Head */}
          <div
            className="rounded-full"
            style={{
              width: 22,
              height: 24,
              background: "#E8E2DA",
              boxShadow: "1px 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          {/* Neck */}
          <div style={{ width: 10, height: 12, background: "#E0D9D0" }} />
          {/* Body */}
          <div
            className="rounded-t-full"
            style={{
              width: 24,
              height: 42,
              background: "linear-gradient(to bottom, #E8E2DA, #D6CFC5)",
              boxShadow: "1px 3px 6px rgba(0,0,0,0.1)",
            }}
          />
          {/* Base */}
          <div
            className="rounded-sm"
            style={{
              width: 30,
              height: 10,
              background: "#CCC5BB",
            }}
          />
        </div>
      </div>
    );
  }

  /* Vase – green or purple cylinder with subtle sheen */
  if (type === "vase") {
    const isPurple = h % 2 === 0;
    const rim = isPurple ? "#7B68AE" : "#5B8C5A";
    const body = isPurple
      ? "linear-gradient(to right, #6B5899, #8B7AB8, #6B5899)"
      : "linear-gradient(to right, #4A7A49, #6B9C6A, #4A7A49)";
    return (
      <div className={cn(base)} style={{ width: 42, height: 98 }}>
        <div className="flex flex-col items-center">
          {/* Rim */}
          <div
            className="rounded-full"
            style={{
              width: 24,
              height: 6,
              background: rim,
            }}
          />
          {/* Body */}
          <div
            style={{
              width: 30,
              height: 58,
              borderRadius: "6px 6px 8px 8px",
              background: body,
              boxShadow: "2px 4px 8px rgba(0,0,0,0.15)",
            }}
          />
        </div>
      </div>
    );
  }

  /* Frame – wood frame with passe-partout (green/purple/yellow), shows generated story image */
  if (type === "frame") {
    const matColor = (["#5B8C5A", "#7B68AE", "#E8AA42"] as const)[h % 3];
    return (
      <div className={cn(base)} style={{ width: 88, height: 118 }}>
        <div
          className="rounded-sm overflow-hidden"
          style={{
            width: 80,
            height: 108,
            background: "linear-gradient(135deg, #C4A882, #D4B896, #B89868)",
            padding: 8,
            boxShadow: "3px 5px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
            transform: "rotate(-2deg)",
            border: "1px solid rgba(0,0,0,0.2)",
          }}
        >
          {/* Passe-partout (mat) – green, purple, or yellow */}
          <div
            className="rounded-sm overflow-hidden"
            style={{
              width: "100%",
              height: "100%",
              padding: 6,
              background: matColor,
            }}
          >
            {/* Image area */}
            <div
              className="w-full h-full rounded-sm overflow-hidden bg-neutral-200"
              style={{ minHeight: 56 }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${matColor}88, ${matColor}CC)`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Ring – wooden/ceramic ring standing up */
  if (type === "ring") {
    return (
      <div className={cn(base)} style={{ width: 52, height: 60 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "7px solid #C4A882",
            background: "transparent",
            boxShadow: "2px 3px 6px rgba(0,0,0,0.12)",
          }}
        />
      </div>
    );
  }

  /* Postcard – tilted card */
  return (
    <div className={cn(base)} style={{ width: 64, height: 90 }}>
      <div
        className="rounded-sm"
        style={{
          width: 58,
          height: 76,
          background: "linear-gradient(135deg, #F5F0E8 0%, #E8E0D4 100%)",
          transform: "rotate(-3deg)",
          boxShadow: "2px 3px 8px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="mx-auto mt-3 rounded-sm"
          style={{ width: 40, height: 28, background: "rgba(0,0,0,0.05)" }}
        />
        <div className="mx-auto mt-2 space-y-1 px-3">
          <div className="h-[2px] rounded-full bg-black/8" />
          <div className="h-[2px] w-3/4 rounded-full bg-black/8" />
        </div>
      </div>
    </div>
  );
}
