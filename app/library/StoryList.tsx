"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BookShelf from "./BookShelf";

type Story = {
  id: string;
  title: string | null;
  tone: string;
  length_key: string;
  status: string;
  created_at: string;
  context_json: Record<string, unknown> | null;
};

export default function StoryList({ stories }: { stories: Story[] }) {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [storyModalId, setStoryModalId] = useState<string | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "story-created" && e.data?.storyId) {
        setCreateModalOpen(false);
        setStoryModalId(e.data.storyId);
      }
      if (e.data?.type === "create-modal-close") {
        setCreateModalOpen(false);
      }
      if (e.data?.type === "story-modal-close") {
        setStoryModalId(null);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    if (storyModalId === id) setStoryModalId(null);
  }

  return (
    <>
      <BookShelf
        stories={stories}
        onDelete={handleDelete}
        onCreateNewStory={() => setCreateModalOpen(true)}
        onOpenStoryModal={(id) => setStoryModalId(id)}
      />

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent
          fullscreen
          className="border-0 p-0 [&_.dialog-body]:p-0"
          animateFromCenter
        >
          <DialogTitle className="sr-only">Create story</DialogTitle>
          <iframe
            src="/create?modal=1"
            title="Create story"
            className="h-full w-full min-h-0 border-0 bg-background"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!storyModalId} onOpenChange={(open) => !open && setStoryModalId(null)}>
        <DialogContent
          fullscreen
          className="border-0 p-0 [&_.dialog-body]:p-0"
          animateFromCenter
        >
          <DialogTitle className="sr-only">Story</DialogTitle>
          {storyModalId && (
            <iframe
              src={`/story/${storyModalId}?modal=1`}
              title="Story"
              className="h-full w-full min-h-0 border-0 bg-background"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
