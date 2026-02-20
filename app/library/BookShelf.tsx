"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import BookCover from "./BookCover";
import DecorativeObject from "./DecorativeObject";
import BookDetailsDialog from "./BookDetailsDialog";
import { useLanguage } from "@/lib/LanguageContext";

type Story = {
  id: string;
  title: string | null;
  tone: string;
  length_key: string;
  status: string;
  created_at: string;
  context_json: Record<string, unknown> | null;
};

type ShelfItem =
  | { kind: "book"; story: Story; index: number }
  | { kind: "deco"; seed: string; index: number; imageUrl?: string }
  | { kind: "new" };

/* ── Deterministic hash ── */
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Seeded random for deterministic but varied placement (LCG for even distribution) */
function seededRandom(seed: number): number {
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;
  const next = ((a * (seed >>> 0) + c) >>> 0) % m;
  return next / m;
}

/**
 * Build items for one shelf row.
 * When includeDeco is true: 2 books + 1 decoration (deco at end). When false: books only.
 */
function buildShelfItems(
  stories: Story[],
  startIdx: number,
  shelfSeed: number,
  includeDeco: boolean
): ShelfItem[] {
  const bookItems: ShelfItem[] = stories.map((story, i) => ({
    kind: "book" as const,
    story,
    index: startIdx + i,
  }));
  if (bookItems.length === 0) return [];

  if (!includeDeco) return bookItems;

  const seedStory = stories[0];
  const seed = seedStory?.id ?? String(shelfSeed);
  const imageUrl = stories.find((s) => s.context_json?.coverImageUrl)?.context_json
    ?.coverImageUrl as string | undefined;
  return [...bookItems, { kind: "deco" as const, seed, index: startIdx + bookItems.length, imageUrl }];
}

/**
 * Split stories into shelf rows.
 * 3 books per row (or 2 books + decoration on every second row). "New story" is first on first row.
 */
function buildShelves(stories: Story[], _perShelf: number): ShelfItem[][] {
  const shelves: ShelfItem[][] = [];
  let offset = 0;

  // First row: "new" + 2 books (3 slots)
  const firstSlice = stories.slice(0, 2);
  const firstSeed = hashStr(firstSlice[0]?.id ?? "0") + 0;
  const firstRowItems = buildShelfItems(firstSlice, 0, firstSeed, false);
  firstRowItems.unshift({ kind: "new" });
  shelves.push(firstRowItems);
  offset += firstSlice.length;

  // Alternating rows: row 1 = 2 books + deco, row 2 = 3 books, row 3 = 2 books + deco, ...
  let i = 2;
  let rowIndex = 1;
  while (i < stories.length) {
    const includeDeco = rowIndex % 2 === 1; // odd rows (1, 3, 5...) get decoration
    const take = includeDeco ? 2 : 3;
    const slice = stories.slice(i, i + take);
    const shelfSeed = hashStr(slice[0]?.id ?? String(i)) + i * 1000;
    shelves.push(buildShelfItems(slice, offset, shelfSeed, includeDeco));
    offset += slice.length;
    i += take;
    rowIndex++;
  }

  if (shelves.length === 0) {
    shelves.push([{ kind: "new" }]);
  }

  return shelves;
}

/**
 * Deterministic slight overlap/tilt for a book based on its index.
 * Some books nudge left (negative margin) to overlap the previous one.
 * Some get a tiny rotation to look casually placed.
 */
function getBookTransform(index: number, id: string): React.CSSProperties {
  const h = hashStr(id);
  const nudge = h % 5 === 0 ? -6 : h % 4 === 0 ? -4 : 0; // slight overlap (smaller on mobile)
  const tilt = h % 7 === 0 ? -1.5 : h % 6 === 0 ? 1 : h % 9 === 0 ? -0.8 : 0;

  return {
    marginLeft: index > 0 ? nudge : 0,
    transform: tilt !== 0 ? `rotate(${tilt}deg)` : undefined,
    zIndex: index, // later books stack on top
  };
}

const newStoryBookClasses =
  "group relative flex-shrink-0 cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ml-1 mr-2 sm:ml-3 sm:mr-4 w-[107px] h-[133px] sm:w-[118px] sm:h-[165px]";

/* ── Shelf Row ── */
function ShelfRow({
  items,
  onBookClick,
  onCreateNewStory,
}: {
  items: ShelfItem[];
  onBookClick: (s: Story) => void;
  onCreateNewStory?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="relative pb-3 sm:pb-4">
      {/* Books area */}
      <div className="flex items-end justify-center gap-2 px-0 pb-0 pt-1.5 sm:gap-3 sm:px-5 sm:pt-4">
        {items.map((item, i) => {
          if (item.kind === "book") {
            return (
              <div
                key={item.story.id}
                className="flex-shrink-0"
                style={getBookTransform(i, item.story.id)}
              >
                <BookCover
                  story={item.story}
                  index={item.index}
                  onClick={() => onBookClick(item.story)}
                />
              </div>
            );
          }
          if (item.kind === "deco") {
            return (
              <div
                key={`deco-${item.seed}-${item.index}`}
                className="flex-shrink-0 mx-0.5 sm:mx-2"
              >
                <DecorativeObject
                  seed={item.seed}
                  index={item.index}
                  imageUrl={item.kind === "deco" ? item.imageUrl : undefined}
                />
              </div>
            );
          }
          const newStoryContent = (
            <>
              {/* Spine – left binding edge, always visible */}
              <div
                className="absolute left-0 top-0 bottom-0 rounded-l-[3px]"
                style={{
                  width: 8,
                  background: "linear-gradient(to right, #A8906C 0%, #C4A882 40%, rgba(0,0,0,0.08) 100%)",
                  boxShadow: "inset -1px 0 2px rgba(0,0,0,0.15), inset 1px 0 1px rgba(255,255,255,0.2)",
                }}
              />
              {/* Cover */}
              <div
                className="absolute top-0 bottom-0 rounded-r-sm"
                style={{
                  left: 8,
                  right: 0,
                  backgroundColor: "#F5F3F0",
                  boxShadow: "4px 6px 12px rgba(0,0,0,0.12), 1px 2px 4px rgba(0,0,0,0.06)",
                }}
              />
              {/* Crease – spine-to-cover edge */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: 7,
                  width: 3,
                  background: "linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.03) 50%, rgba(255,255,255,0.1) 100%)",
                }}
              />
              {/* Title at top (Garamond), plus icon below – like other books */}
              <div
                className="relative flex h-full w-full flex-col items-center justify-start pt-5 pb-4 gap-3 text-center"
                style={{
                  paddingLeft: 16,
                  paddingRight: 8,
                  fontFamily: "var(--font-book-3)",
                }}
              >
                <span
                  className="font-extrabold text-base leading-tight text-neutral-600 group-hover:text-primary transition-colors"
                  style={{ fontFamily: "var(--font-book-1)" }}
                >
                  {t("library.newStory")}
                </span>
                <div className="flex-1 flex items-center justify-center">
                  <PlusIcon className="size-7 text-neutral-400 transition-colors group-hover:text-primary sm:size-8" />
                </div>
              </div>
              {/* Page edge */}
              <div
                className="absolute bottom-0 right-0 h-[3px] rounded-br-sm"
                style={{
                  left: 8,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.08))",
                }}
              />
            </>
          );
          if (onCreateNewStory) {
            return (
              <button
                key="new-story"
                type="button"
                onClick={onCreateNewStory}
                className={newStoryBookClasses}
                aria-label={t("library.createNewStory")}
              >
                {newStoryContent}
              </button>
            );
          }
          return (
            <Link
              key="new-story"
              href="/create"
              className={newStoryBookClasses}
              aria-label={t("library.createNewStory")}
            >
              {newStoryContent}
            </Link>
          );
        })}
      </div>

      {/* Shelf ledge – wood tone (light in light mode, dark wood in dark mode) */}
      <div
        className="relative h-[6px] sm:h-[8px] rounded-b-[2px]"
        style={{
          background: "var(--shelf-ledge)",
          boxShadow: "var(--shelf-ledge-shadow)",
        }}
      />
    </div>
  );
}

/* ── Main BookShelf ── */
export default function BookShelf({
  stories,
  onDelete,
  onCreateNewStory,
  onOpenStoryModal,
}: {
  stories: Story[];
  onDelete: (id: string) => void;
  /** When set, "new story" opens create in a modal instead of linking to /create. */
  onCreateNewStory?: () => void;
  /** When set, "Start reading" opens the story in a modal instead of navigating. */
  onOpenStoryModal?: (storyId: string) => void;
}) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const fn = () => setIsMobile(!mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const perShelf = 3; // 3 books per row (or 2 + deco on alternating rows)
  const shelves = useMemo(() => buildShelves(stories, perShelf), [stories, perShelf]);

  function handleBookClick(story: Story) {
    setSelectedStory(story);
    setDrawerOpen(true);
  }

  return (
    <>
      {/* Wall back-panel – light wood in light mode, dark wood in dark mode */}
      <div
        className="rounded-xl p-1.5 sm:p-5"
        style={{
          background: "var(--shelf-wall)",
          boxShadow: "var(--shelf-wall-shadow)",
        }}
      >
        {shelves.map((items, i) => (
          <ShelfRow
            key={i}
            items={items}
            onBookClick={handleBookClick}
            onCreateNewStory={onCreateNewStory}
          />
        ))}
      </div>

      <BookDetailsDialog
        story={selectedStory}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDelete={onDelete}
        onOpenStoryModal={onOpenStoryModal}
      />
    </>
  );
}
