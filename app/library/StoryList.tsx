"use client";

import { useRouter } from "next/navigation";
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

  async function handleDelete(id: string) {
    const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return <BookShelf stories={stories} onDelete={handleDelete} />;
}
