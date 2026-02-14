"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import BookCover from "./BookCover";
import DecorativeObject from "./DecorativeObject";
import BookDetailsDialog from "./BookDetailsDialog";

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
  | { kind: "deco"; seed: string; index: number }
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

/**
 * Build items for one shelf row.
 * Inserts a decorative object every ~2-3 books for more frequent decoration.
 */
function buildShelfItems(stories: Story[], startIdx: number): ShelfItem[] {
  const items: ShelfItem[] = [];
  stories.forEach((story, i) => {
    // Insert deco after every 3rd book
    if (i > 0 && i % 3 === 0) {
      items.push({ kind: "deco", seed: story.id, index: startIdx + i });
    }
    items.push({ kind: "book", story, index: startIdx + i });
  });
  return items;
}

/**
 * Split stories into shelf rows.
 * Mobile: 3 books/shelf, Desktop: 4 books/shelf.
 */
function buildShelves(stories: Story[], perShelf: number): ShelfItem[][] {
  const shelves: ShelfItem[][] = [];
  let offset = 0;

  // Reserve 1 slot on the last row for the "new book"
  // so total book slots = perShelf - 1 on the final row
  const total = stories.length;

  for (let i = 0; i < total; i += perShelf) {
    const remaining = total - i;
    // If this is the last batch and it would fill the row exactly,
    // leave room for the "new" slot by taking one fewer
    const isFinalBatch = i + perShelf >= total;
    const take = isFinalBatch ? Math.min(remaining, perShelf - 1) : perShelf;

    const slice = stories.slice(i, i + take);
    shelves.push(buildShelfItems(slice, offset));
    offset += slice.length;

    // If we took fewer to leave room, but there are leftovers, continue
    if (isFinalBatch && take < remaining) {
      const leftover = stories.slice(i + take, i + take + (perShelf - 1));
      const items = buildShelfItems(leftover, offset);
      items.push({ kind: "new" });
      shelves.push(items);
      offset += leftover.length;
      return shelves;
    }
  }

  if (shelves.length === 0) {
    shelves.push([]);
  }
  shelves[shelves.length - 1].push({ kind: "new" });

  return shelves;
}

/**
 * Deterministic slight overlap/tilt for a book based on its index.
 * Some books nudge left (negative margin) to overlap the previous one.
 * Some get a tiny rotation to look casually placed.
 */
function getBookTransform(index: number, id: string): React.CSSProperties {
  const h = hashStr(id);
  const nudge = h % 5 === 0 ? -8 : h % 4 === 0 ? -5 : 0; // slight overlap
  const tilt = h % 7 === 0 ? -1.5 : h % 6 === 0 ? 1 : h % 9 === 0 ? -0.8 : 0;

  return {
    marginLeft: index > 0 ? nudge : 0,
    transform: tilt !== 0 ? `rotate(${tilt}deg)` : undefined,
    zIndex: index, // later books stack on top
  };
}

/* ── Shelf Row ── */
function ShelfRow({
  items,
  onBookClick,
}: {
  items: ShelfItem[];
  onBookClick: (s: Story) => void;
}) {
  return (
    <div className="relative pb-3 sm:pb-4">
      {/* Books area */}
      <div className="flex items-end justify-center px-2 pb-0 pt-3 sm:px-5 sm:pt-4">
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
                <DecorativeObject seed={item.seed} index={item.index} />
              </div>
            );
          }
          /* "+ new" slot – blank white book */
          return (
            <Link
              key="new-story"
              href="/create"
              className="group relative ml-1 flex-shrink-0 cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                w-[105px] h-[145px] sm:w-[118px] sm:h-[165px] sm:ml-2"
              aria-label="Create new story"
            >
              {/* Spine */}
              <div
                className="absolute left-0 top-0 bottom-0 rounded-l-[3px]"
                style={{
                  width: 8,
                  background: "linear-gradient(to right, #D8D8D8 0%, #D8D8D8 40%, rgba(0,0,0,0.08) 100%)",
                  boxShadow: "inset -1px 0 2px rgba(0,0,0,0.1), inset 1px 0 1px rgba(255,255,255,0.3)",
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
              {/* Crease */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: 7,
                  width: 3,
                  background: "linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.03) 50%, rgba(255,255,255,0.1) 100%)",
                }}
              />
              {/* Plus icon */}
              <div className="relative flex h-full w-full items-center justify-center" style={{ paddingLeft: 8 }}>
                <PlusIcon className="size-7 text-neutral-400 transition-colors group-hover:text-primary sm:size-8" />
              </div>
              {/* Page edge */}
              <div
                className="absolute bottom-0 right-0 h-[3px] rounded-br-sm"
                style={{
                  left: 8,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.08))",
                }}
              />
            </Link>
          );
        })}
      </div>

      {/* Shelf ledge – clean, light colored with shadow underneath */}
      <div
        className="relative h-[6px] sm:h-[8px] rounded-b-[2px]"
        style={{
          background: "linear-gradient(to bottom, hsl(35 15% 78%), hsl(35 12% 72%))",
          boxShadow: "0 4px 8px rgba(0,0,0,0.15), 0 2px 3px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}

/* ── Main BookShelf ── */
export default function BookShelf({
  stories,
  onDelete,
}: {
  stories: Story[];
  onDelete: (id: string) => void;
}) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mobileShelves = useMemo(() => buildShelves(stories, 3), [stories]);
  const desktopShelves = useMemo(() => buildShelves(stories, 4), [stories]);

  function handleBookClick(story: Story) {
    setSelectedStory(story);
    setDrawerOpen(true);
  }

  return (
    <>
      {/* Wall back-panel – warm, light, like the reference */}
      <div
        className="rounded-xl p-3 sm:p-5"
        style={{
          background: "linear-gradient(180deg, hsl(35 15% 88%) 0%, hsl(35 12% 84%) 100%)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Mobile layout: 3 per shelf */}
        <div className="block sm:hidden">
          {mobileShelves.map((items, i) => (
            <ShelfRow key={`m-${i}`} items={items} onBookClick={handleBookClick} />
          ))}
        </div>

        {/* Desktop layout: 4 per shelf */}
        <div className="hidden sm:block">
          {desktopShelves.map((items, i) => (
            <ShelfRow key={`d-${i}`} items={items} onBookClick={handleBookClick} />
          ))}
        </div>
      </div>

      <BookDetailsDialog
        story={selectedStory}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDelete={onDelete}
      />
    </>
  );
}
