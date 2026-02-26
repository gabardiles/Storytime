"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import BookShelf from "./BookShelf";
import { CreateStoryForm } from "@/components/CreateStoryForm";

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
  const [storyIframeLoaded, setStoryIframeLoaded] = useState(false);

  useEffect(() => {
    setStoryIframeLoaded(false);
  }, [storyModalId]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
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
          animateFromCenter
          className="border-0 p-0 [&_.dialog-body]:p-0 [&_.dialog-body]:overflow-y-auto [&_.dialog-body]:min-h-0 [&_.dialog-body]:min-h-[70vh]"
        >
          <DialogTitle className="sr-only">Create story</DialogTitle>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CreateStoryForm
              isModal
              onClose={() => setCreateModalOpen(false)}
              onStoryCreated={(storyId) => {
                setCreateModalOpen(false);
                setStoryModalId(storyId);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!storyModalId} onOpenChange={(open) => !open && setStoryModalId(null)}>
        <DialogContent
          animateFromCenter
          className="border-0 p-0 [&_.dialog-body]:p-0 [&_.dialog-body]:flex [&_.dialog-body]:min-h-0"
        >
          <DialogTitle className="sr-only">Story</DialogTitle>
          {storyModalId && (
            <div className="relative flex-1 flex flex-col min-h-[70vh] w-full">
              {!storyIframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background p-6">
                  <Skeleton className="h-8 w-48 rounded" />
                  <Skeleton className="h-4 w-full max-w-sm rounded" />
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                  </div>
                  <div className="mt-8 w-full max-w-md space-y-3">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-4/5 rounded" />
                  </div>
                </div>
              )}
              <iframe
                src={`/story/${storyModalId}?modal=1`}
                title="Story"
                className={`h-full w-full min-h-[70vh] border-0 bg-background ${!storyIframeLoaded ? "invisible" : ""}`}
                onLoad={() => setStoryIframeLoaded(true)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
