"use client";

import { useRouter } from "next/navigation";
import StoryCard from "./StoryCard";

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

  return (
    <div className="space-y-4">
      {stories.map((s) => (
        <StoryCard key={s.id} story={s} onDelete={handleDelete} />
      ))}
    </div>
  );
}
